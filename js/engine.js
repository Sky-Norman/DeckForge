// js/engine.js

// --- GAME STATE ---
const GAME_STATE = {
    turn: 1,
    activePlayerId: 'A', 
    players: {
        'A': { id: 'A', health: 20, score: 0, resources: [], deck: [], hand: [], board: [], modifiers: [], reactiveModifiers: [], inkUsedThisTurn: false }, 
        'B': { id: 'B', health: 20, score: 0, resources: [], deck: [], hand: [], board: [], modifiers: [], reactiveModifiers: [], inkUsedThisTurn: false } 
    },
    eventLog: [] 
};

// --- CORE UTILITY FUNCTIONS ---

function getCardCost(cardData, activePlayerId) {
    let cost = cardData.inkCost;
    const activePlayer = GAME_STATE.players[activePlayerId];
    
    activePlayer.modifiers.forEach(mod => {
        if (mod.type === 'CostReduction' && cardData.keywords.includes(mod.targetTag)) {
            cost = Math.max(0, cost - mod.value);
        }
    });

    return cost; 
}

function consumeInk(player, amount) {
    if (player.resources.filter(r => !r.exerted).length < amount) {
        return false; // Not enough ready ink
    }
    
    player.resources.filter(r => !r.exerted).slice(0, amount).forEach(inkSlot => {
        inkSlot.exerted = true;
    });
    
    return true;
}

function applyDamage(targetPlayerId, damageAmount) {
    const player = GAME_STATE.players[targetPlayerId];
    let finalDamage = damageAmount;
    
    player.health -= finalDamage;
    GAME_STATE.eventLog.push(`[RULE] ${player.id} took ${finalDamage} damage. Health remaining: ${player.health}`);
    
    return finalDamage;
}

function applyHeal(targetCharacter, healAmount) {
    const newDamage = Math.max(0, targetCharacter.damage - healAmount);
    const actualHealed = targetCharacter.damage - newDamage;
    targetCharacter.damage = newDamage;

    GAME_STATE.eventLog.push(`[RULE] ${targetCharacter.name} healed ${actualHealed} damage. Damage remaining: ${targetCharacter.damage}`);
    
    return actualHealed;
}

function drawCard(playerId) {
    const player = GAME_STATE.players[playerId];
    
    if (player.deck.length === 0) {
        GAME_STATE.eventLog.push(`[RULE] ${playerId} cannot draw—deck is empty.`);
        return false;
    }
    
    const drawnCard = player.deck.pop(); 
    
    // Safety check for invalid card objects
    if (!drawnCard || !drawnCard.name) {
        GAME_STATE.eventLog.push(`[ERROR] ${playerId} drew an invalid card object. Skipping draw.`);
        return false;
    }
    
    player.hand.push(drawnCard);
    
    GAME_STATE.eventLog.push(`[RULE] ${playerId} drew ${drawnCard.name}. Hand size: ${player.hand.length}`);
    return true;
}

function getLorePotential(playerId) {
    const player = GAME_STATE.players[playerId];
    let totalLore = 0;
    
    player.board.forEach(card => {
        if (!card.exerted && card.cardType === "Character" && (card.turnPlayed !== GAME_STATE.turn)) {
            totalLore += card.lore;
        }
    });
    return totalLore;
}

function getReadyCharacters(player) {
    return player.board.filter(card => 
        !card.exerted && 
        (card.turnPlayed !== GAME_STATE.turn)
    );
}

// --- ACTION UTILITIES (Used by Decision Engine) ---

function inkCard(player, cardIndex) {
    const cardToInk = player.hand[cardIndex];
    
    if (cardToInk.isInkable !== true) {
        GAME_STATE.eventLog.push(`[FAIL] ${player.id} attempted to ink ${cardToInk.name}, but it is not Inkable.`);
        return false;
    }
    
    // Move card from hand to resources (Inkwell)
    player.hand.splice(cardIndex, 1); // Remove from hand
    player.resources.push({
        name: cardToInk.name,
        exerted: true, // Comes into play exerted
        isInk: true,
        instanceId: Date.now() 
    });
    player.inkUsedThisTurn = true; // Mark as used
    
    GAME_STATE.eventLog.push(`[INK] ${player.id} inked ${cardToInk.name}. Total Inkwell slots: ${player.resources.length}`);
    return true;
}

function canAffordAndPlay(player, cardIndex, actionType) {
    const cardData = player.hand[cardIndex];
    if (!cardData) return false;

    // A. INK ACTION
    if (actionType === 'ink') {
        if (player.inkUsedThisTurn) {
            GAME_STATE.eventLog.push(`[FAIL] ${player.id} has already used their Ink for this turn.`);
            return false;
        }
        return inkCard(player, cardIndex);
    }
    
    // B. PLAY ACTION (Character, Item, Action)
    if (actionType === 'play') {
        const actualCost = getCardCost(cardData, player.id);
        
        // 1. Check affordability
        if (player.resources.filter(r => !r.exerted).length < actualCost) {
            GAME_STATE.eventLog.push(`[FAIL] ${player.id} cannot afford to play ${cardData.name} (Cost: ${actualCost}).`);
            return false;
        }

        // 2. Consume Ink
        if (!consumeInk(player, actualCost)) return false; 
        
        // 3. Remove from Hand
        player.hand.splice(cardIndex, 1);
        
        // 4. Execute Card Template Logic
        const templateFunction = CardTemplates[cardData.template];
        if (templateFunction) {
            templateFunction(GAME_STATE, cardData, player.id); 
            return true;
        } else {
            GAME_STATE.eventLog.push(`[ERROR] Template ${cardData.template} not found for ${cardData.name}.`);
            return false;
        }
    }
    
    return false;
}

// --- COMBAT UTILITIES ---

function banishCard(player, opponent, banishedCard) {
    // 1. Remove card from its owner's board
    const owner = GAME_STATE.players[banishedCard.ownerId];
    const originalBoardLength = owner.board.length;
    
    owner.board = owner.board.filter(card => card.instanceId !== banishedCard.instanceId);
    
    if (owner.board.length === originalBoardLength) {
        GAME_STATE.eventLog.push(`[ERROR] Banish failed: ${banishedCard.name} not found on board.`);
        return;
    }

    GAME_STATE.eventLog.push(`[BANISH] ${banishedCard.name} was banished.`);

    // 2. Trigger Reactive Modifiers (e.g., Mickey Mouse's Ceaseless Worker)
    [player, opponent].forEach(p => {
        p.reactiveModifiers.forEach(mod => {
            if (mod.type === 'OnBanished') {
                mod.effect(GAME_STATE, banishedCard);
            }
        });
    });
}

function calculateCombat(attacker, defender, activePlayer, opponent) {
    GAME_STATE.eventLog.push(`[COMBAT] ${attacker.name} (${attacker.strength}/${attacker.willpower}, DMG: ${attacker.damage}) vs ${defender.name} (${defender.strength}/${defender.willpower}, DMG: ${defender.damage}).`);

    // 1. Apply Damage (Simultaneous)
    defender.damage += attacker.strength;
    attacker.damage += defender.strength;

    // 2. Check for Banishment
    let banishedCount = 0;
    
    if (defender.damage >= defender.willpower) {
        banishCard(activePlayer, opponent, defender);
        banishedCount++;
    }
    
    if (attacker.damage >= attacker.willpower) {
        banishCard(activePlayer, opponent, attacker);
        banishedCount++;
    }
    
    return banishedCount > 0;
}

function attemptQuest(player) {
    const questableCharacters = getReadyCharacters(player);
    if (questableCharacters.length > 0) {
        const charToQuest = questableCharacters.sort((a, b) => b.lore - a.lore)[0];
        
        charToQuest.exerted = true;
        player.score += charToQuest.lore;
        
        GAME_STATE.eventLog.push(`[QUEST] ${charToQuest.name} quests for ${charToQuest.lore} Lore. Total score: ${player.score}.`);
        return true; 
    }
    return false;
}

function attemptChallenge(player, opponent) {
    const readyChallengers = getReadyCharacters(player).sort((a, b) => b.strength - a.strength);
    const exertedTargets = opponent.board.filter(card => card.exerted);

    if (readyChallengers.length > 0 && exertedTargets.length > 0) {
        const attacker = readyChallengers[0]; // Strongest ready attacker
        const defender = exertedTargets[0]; // Simplest target: the first exerted card

        // Exert attacker (Core Rule)
        attacker.exerted = true;

        // Run the Combat Logic
        calculateCombat(attacker, defender, player, opponent);
        
        return true; // Action succeeded
    }
    return false; // No valid challenge target found
}


// --- INITIAL DECK SETUP (STABLE LOGIC) ---
function initializeDeckForTest(playerId) {
    const player = GAME_STATE.players[playerId];
    
    // Get the Goofy card for the test
    const goofyCard = masterCardData.find(c => c.id === "C1-073");
    const simbaCard = masterCardData.find(c => c.id === "C020-C1"); 

    const dummyCard = { name: "Dummy Card", exerted: false, isInkable: true, inkCost: 1 };
    
    const deckStack = [];

    // STACK FOR T1-T4 DRAW (Draws T1, T2, T3, Goofy on T4)
    deckStack.push({...dummyCard}, {...dummyCard}, {...dummyCard}); 
    if (goofyCard) {
        deckStack.push({...goofyCard}); 
    } else {
        deckStack.push({...dummyCard});
    }

    // Stack the remaining 56 cards as dummies
    for (let i = 0; i < 56; i++) {
        deckStack.push({...dummyCard});
    }
    
    // Assign the new deck (60 total cards).
    player.deck = deckStack;
    player.deck.reverse(); // Reverse for POP() draw

    // --- SETUP FOR COMBAT TEST (Opponent B starts with an exerted Simba) ---
    if (playerId === 'B' && simbaCard) {
        GAME_STATE.players['B'].board.push({
            ...simbaCard,
            instanceId: Date.now() + 1000,
            exerted: true, 
            damage: 0,
            ownerId: 'B',
            turnPlayed: 0
        });
        GAME_STATE.eventLog.push(`[SETUP] Opponent B placed Simba (2/2) on board, exerted.`);
    }
    
    GAME_STATE.eventLog.push(`[SETUP] ${playerId}'s deck initialized (Goofy Card staged for T4).`);
}

// --- GAME PHASE LOGIC ---

function beginningPhase(player) {
    GAME_STATE.eventLog.push(`[PHASE] Beginning Phase`);

    // A. READY
    player.resources.forEach(inkSlot => {
        inkSlot.exerted = false; 
    });
    player.board.forEach(card => {
        const denialMod = card.modifiers.find(mod => mod.type === "ReadyDenial");
        if (!denialMod) {
            card.exerted = false; 
            GAME_STATE.eventLog.push(`-> ${card.name} readies.`);
        }
    });
    GAME_STATE.eventLog.push(`-> All exertable cards ready.`);

    // B. SET
    player.board.forEach(card => {
        // Event Manager would raise the "onTurnStart" event here
    });

    // C. DRAW
    drawCard(player.id);
}

function mainPhase(player) {
    GAME_STATE.eventLog.push(`[PHASE] Main Phase (Decision Engine runs here)`);
    makeDecision(player);
}

function endTurnPhase(player) {
    GAME_STATE.eventLog.push(`[PHASE] End of Turn Phase`);
    player.inkUsedThisTurn = false;
}

// --- MAIN LOOP ORCHESTRATOR (WITH PLAYER SWITCH FIX) ---

function runTurn() {
    // 1. DETERMINE CURRENT PLAYER
    const currentPlayerId = GAME_STATE.activePlayerId;
    const player = GAME_STATE.players[currentPlayerId];
    
    // --- INITIALIZATION (Run only on Turn 1) ---
    if (GAME_STATE.turn === 1) {
        initializeDeckForTest('A');
        initializeDeckForTest('B'); 
        // NOTE: activePlayerId is already 'A' from the global definition.
    }
    
    GAME_STATE.eventLog.push(`--- TURN ${GAME_STATE.turn}: START (${currentPlayerId}) ---`);

    // 2. EXECUTE PHASES
    beginningPhase(player);
    mainPhase(player);
    endTurnPhase(player);

    GAME_STATE.eventLog.push(`--- TURN ${GAME_STATE.turn}: END (${currentPlayerId}) ---`);
    
    // 3. ADVANCE STATE (CRITICAL FIX)
    GAME_STATE.turn++; 
    GAME_STATE.activePlayerId = (currentPlayerId === 'A' ? 'B' : 'A'); 
}


// --- MODIFIER FUNCTIONS (Referenced by Templates) ---

function modifier_AnimateBroom(characterInstance) {
    const activePlayer = GAME_STATE.players[GAME_STATE.activePlayerId];
    
    const modifier = {
        id: `CostRedux_${characterInstance.instanceId}`,
        type: 'CostReduction',
        targetTag: 'Broom', 
        value: characterInstance.costReduction, 
        sourceCard: characterInstance.name
    };

    activePlayer.modifiers.push(modifier);
    GAME_STATE.eventLog.push(`[MODIFIER] ${characterInstance.name} added Cost Reduction modifier.`);
}

function modifier_CeaselessWorker(characterInstance) {
    const activePlayer = GAME_STATE.players[GAME_STATE.activePlayerId];
    
    const modifier = {
        id: `ReturnHand_${characterInstance.instanceId}`,
        type: 'OnBanished', 
        targetTag: 'Broom',
        sourceCard: characterInstance.name,
        
        effect: (gameState, banishedCard) => { // NOTE: Corrected parameter name here
            if (banishedCard.keywords.includes("Broom") && banishedCard.ownerId === activePlayer.id) {
                activePlayer.hand.push(banishedCard); 
                GAME_STATE.eventLog.push(`[REACT] ${characterInstance.name} triggered: ${banishedCard.name} returned to hand.`);
                return true;
            }
        }
    };
    
    activePlayer.reactiveModifiers.push(modifier); 
}

// --- CARD TEMPLATES (The Executable Logic) ---
const CardTemplates = {
    
    "DirectDamage": (gameState, cardData, playerId) => {
        const activePlayer = gameState.players[playerId];
        const opponentId = (playerId === 'A' ? 'B' : 'A');
        const actualCost = getCardCost(cardData, activePlayer.id); 

        if (cardData.target === 'opponent') {
            gameState.eventLog.push(`[ACTION] ${activePlayer.id} plays ${cardData.name} (Cost: ${actualCost}).`);
            const damageDealt = applyDamage(opponentId, cardData.value);
            gameState.eventLog.push(`-> Effect: Dealt ${damageDealt} damage to ${opponentId}.`);
        } 
        
        return true;
    },
    
    "HealTargetCharacter": (gameState, cardData, playerId) => {
        const activePlayer = gameState.players[playerId];
        const actualCost = getCardCost(cardData, activePlayer.id); 

        const dummyCharacter = {
            name: "Dummy Target",
            damage: 5 
        };
        
        const healedAmount = applyHeal(dummyCharacter, cardData.value); 

        gameState.eventLog.push(`[ACTION] ${activePlayer.id} plays ${cardData.name} (Cost: ${actualCost}).`);
        gameState.eventLog.push(`-> Effect: Targeted ${dummyCharacter.name}, Healed ${healedAmount}.`);

        return true;
    },
    
    "StandardCharacter": (gameState, cardData, playerId) => {
        const activePlayer = gameState.players[playerId];
        const actualCost = getCardCost(cardData, activePlayer.id);
        
        // Create Character Instance and place on Board
        const characterInstance = { 
            ...cardData, 
            instanceId: Date.now(),
            exerted: true, // Comes into play exerted
            damage: 0,
            ownerId: activePlayer.id,
            turnPlayed: gameState.turn 
        };
        activePlayer.board.push(characterInstance);
        
        gameState.eventLog.push(`[ACTION] ${activePlayer.id} played ${cardData.name} for ${actualCost} Ink. Added to board.`);

        // Check and Apply Keywords/Persistent Effects
        if (cardData.keywords.includes("ANIMATE_BROOM")) {
            modifier_AnimateBroom(characterInstance);
        }
        if (cardData.keywords.includes("CEASELESS_WORKER")) {
            modifier_CeaselessWorker(characterInstance);
        }

        return true; 
    }
};

// --- DECISION ENGINE (The "Small AI" Logic) ---

function makeDecision(player) {
    const opponentId = (player.id === 'A' ? 'B' : 'A');
    const opponent = GAME_STATE.players[opponentId];
    
    const playerLore = getLorePotential(player.id);
    const opponentLore = getLorePotential(opponentId);

    GAME_STATE.eventLog.push(`[DECISION CONTEXT] Player Lore Potential: ${playerLore}, Opponent Lore Potential: ${opponentLore}`);

    // The core loop: keep attempting actions until we run out of options
    let actionTaken = true;
    while (actionTaken) {
        actionTaken = false; 

        // 1. INK DECISION (Highest Priority, Once Per Turn)
        if (!player.inkUsedThisTurn) {
            const readyInkCount = player.resources.filter(r => !r.exerted).length;
            const cheapestPlayableCost = player.hand.filter(c => c.cardType === 'Character').map(c => getCardCost(c, player.id)).sort((a, b) => a - b)[0] || 99;

            // Ink if we can't play the cheapest card now, and we need ink (below 7).
            if ((cheapestPlayableCost > readyInkCount || player.resources.length < 4) && player.resources.length < 7) {
                 const inkableCardIndex = player.hand.findIndex(card => card.isInkable === true);
                 if (inkableCardIndex !== -1) {
                     if (canAffordAndPlay(player, inkableCardIndex, 'ink')) {
                         actionTaken = true;
                         continue; 
                     }
                 }
            }
        }

        // 2. CARD PLAY DECISION
        const readyInkCount = player.resources.filter(r => !r.exerted).length;
        
        const affordableCharacters = player.hand
            .map((card, index) => ({ card, index, cost: getCardCost(card, player.id) }))
            .filter(item => item.card.cardType === 'Character' && item.cost <= readyInkCount)
            .sort((a, b) => a.cost - b.cost);
            
        if (affordableCharacters.length > 0) {
            const chosenCard = affordableCharacters[0];
            if (canAffordAndPlay(player, chosenCard.index, 'play')) {
                actionTaken = true;
                continue;
            }
        }

        // 3. ACTION DECISION (Quest vs. Challenge)
        const readyCharacters = getReadyCharacters(player);

        if (readyCharacters.length > 0) {
            if (opponentLore > playerLore) {
                // Favor Challenging
                if (attemptChallenge(player, opponent)) { 
                    actionTaken = true;
                    continue;
                }
            }
            
            // If challenging failed or player is ahead/equal, favor Questing
            if (attemptQuest(player)) { 
                actionTaken = true;
                continue;
            }
        }
    }
    
    GAME_STATE.eventLog.push(`[DECISION] No more profitable actions for ${player.id}.`);
}