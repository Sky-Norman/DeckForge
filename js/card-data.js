// js/card-data.js
const masterCardData = [
    // --- AMBER (Healing/Support) ---
    {
        "id": "C1-016", "name": "Mickey Mouse, True Friend", "inkType": "Amber", "inkCost": 3, "isInkable": true, "cardType": "Character",
        "cardText": "When played, heal 2 damage from all other characters.", "template": "StandardCharacter", "strength": 2, "willpower": 3, "lore": 1, 
        "keywords": ["ON_PLAY_HEAL_ALL"], "value": 2
    },
    {
        "id": "C1-011", "name": "Stitch, New Recruit", "inkType": "Amber", "inkCost": 2, "isInkable": true, "cardType": "Character",
        "cardText": "Lore: 1", "template": "StandardCharacter", "strength": 2, "willpower": 2, "lore": 1, "keywords": []
    },
    {
        "id": "C1-021", "name": "Healing Glow", "inkType": "Amber", "inkCost": 1, "isInkable": true, "cardType": "Action",
        "cardText": "Heal 3 damage from one of your characters.", "template": "HealTargetCharacter", "strength": 0, "willpower": 0, "lore": 0, 
        "keywords": [], "value": 3, "target": "selfCharacter" 
    },
    {
        "id": "C1-026", "name": "One Jump Ahead", "inkType": "Amber", "inkCost": 2, "isInkable": true, "cardType": "Action",
        "cardText": "Move a character from your hand to your inkwell exerted. Draw a card.", "template": "InkAndDraw", "keywords": []
    },
    
    // --- RUBY (Aggression/Banish) ---
    {
        "id": "C1-140", "name": "Maleficent, Sorceress", "inkType": "Ruby", "inkCost": 5, "isInkable": true, "cardType": "Character",
        "cardText": "When you play this character, you may deal 2 damage to a chosen character.", "template": "StandardCharacter", "strength": 3, "willpower": 4, "lore": 2, 
        "keywords": ["ON_PLAY_DAMAGE"], "value": 2
    },
    {
        "id": "C1-133", "name": "Gaston, Intellectual Powerhouse", "inkType": "Ruby", "inkCost": 3, "isInkable": true, "cardType": "Character",
        "cardText": "Lore: 1", "template": "StandardCharacter", "strength": 3, "willpower": 3, "lore": 1, "keywords": []
    },
    {
        "id": "C1-147", "name": "Fire Blast (Our Existing Card)", "inkType": "Ruby", "inkCost": 3, "isInkable": true, "cardType": "Action",
        "cardText": "Deal 5 damage to chosen character.", "template": "DirectDamage", "strength": 0, "willpower": 0, "lore": 0, 
        "keywords": [], "value": 5, "target": "opponentCharacter" // Changed target to character
    },
    {
        "id": "C1-137", "name": "Dragon Fire", "inkType": "Ruby", "inkCost": 5, "isInkable": false, "cardType": "Action",
        "cardText": "Banish one chosen character.", "template": "BanishTarget", "keywords": [], "value": 0
    },
    
    // --- EMERALD (Evasive/Control) ---
    {
        "id": "C1-073", "name": "Goofy, Daredevil (Our Existing Card)", "inkType": "Emerald", "inkCost": 4, "isInkable": false, "cardType": "Character",
        "cardText": "Lore: 1", "template": "StandardCharacter", "strength": 3, "willpower": 5, "lore": 1, "keywords": []
    },
    {
        "id": "C1-078", "name": "Aladdin, Street Rat", "inkType": "Emerald", "inkCost": 2, "isInkable": true, "cardType": "Character",
        "cardText": "Evasive (Can only be challenged by characters with Evasive).", "template": "StandardCharacter", "strength": 2, "willpower": 2, "lore": 1, 
        "keywords": ["Evasive"]
    },
    {
        "id": "C1-096", "name": "Fanfare", "inkType": "Emerald", "inkCost": 3, "isInkable": true, "cardType": "Action",
        "cardText": "Choose a character. Ready that character. They can't quest for the rest of this turn.", "template": "ReadyCharacter", "keywords": []
    },
    
    // --- AMETHYST (Draw/Discard/Bounce) ---
    {
        "id": "C1-028", "name": "Dr. Facilier, Agent Provocateur", "inkType": "Amethyst", "inkCost": 4, "isInkable": true, "cardType": "Character",
        "cardText": "When played, look at the top two cards of your deck. Put one into your hand and the other on the bottom of your deck.", "template": "StandardCharacter", "strength": 2, "willpower": 4, "lore": 2, 
        "keywords": ["ON_PLAY_SCRY"]
    },
    {
        "id": "C1-036", "name": "Minnie Mouse, Beloved Princess", "inkType": "Amethyst", "inkCost": 2, "isInkable": true, "cardType": "Character",
        "cardText": "Lore: 1", "template": "StandardCharacter", "strength": 2, "willpower": 2, "lore": 1, "keywords": []
    },
    {
        "id": "C1-044", "name": "Friends on the Other Side", "inkType": "Amethyst", "inkCost": 3, "isInkable": true, "cardType": "Action",
        "cardText": "Draw 2 cards.", "template": "DrawCards", "keywords": [], "value": 2
    },
    {
        "id": "C1-048", "name": "Mickey Mouse, Wayward Sorcerer (Our Existing Card)", "inkType": "Amethyst", "inkCost": 8, "isInkable": false, "cardType": "Character",
        "cardText": "ANIMATE BROOM: You pay 10 less to play Broom characters. CEASELESS WORKER: Whenever one of your Broom characters is banished in a challenge, you may return that card to your hand.",
        "template": "StandardCharacter", "strength": 3, "willpower": 4, "lore": 2, "keywords": ["ANIMATE_BROOM", "CEASELESS_WORKER"], "costReduction": 10
    },

    // --- STEEL (Defense/Rush) ---
    {
        "id": "C1-168", "name": "Simba, Protective Cub (Our Existing Card)", "inkType": "Steel", "inkCost": 2, "isInkable": true, "cardType": "Character",
        "cardText": "Lore: 1", "template": "StandardCharacter", "strength": 2, "willpower": 2, "lore": 1, "keywords": []
    },
    {
        "id": "C1-169", "name": "Captain Hook, Forceful Duelist", "inkType": "Steel", "inkCost": 3, "isInkable": true, "cardType": "Character",
        "cardText": "Challenger +2 (When challenging, this character gets +2 Strength).", "template": "StandardCharacter", "strength": 2, "willpower": 3, "lore": 1, 
        "keywords": ["Challenger"], "challengeBonus": 2
    },
    {
        "id": "C1-177", "name": "Frying Pan", "inkType": "Steel", "inkCost": 2, "isInkable": true, "cardType": "Item",
        "cardText": "Ability: Exhaust this item to deal 1 damage to a chosen character.", "template": "StandardItem", "keywords": ["ABILITY_DAMAGE"], "value": 1
    }
];