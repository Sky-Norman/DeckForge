// js/card-data.js
const masterCardData = [
    {
        "id": "C-001", "name": "Fire Blast", "inkType": "Ruby", "inkCost": 3, "isInkable": true, "cardType": "Action", "text": "Deal 5 damage.", "template": "DirectDamage", "value": 5, "target": "opponent"
    },
    {
        "id": "C004-C1", "name": "Healing Glow", "inkType": "Emerald", "inkCost": 1, "isInkable": true, "cardType": "Action", "text": "Heal 3 damage.", "template": "HealTargetCharacter", "value": 3, "target": "selfCharacter" 
    },
    {
        "id": "C051-C1", "name": "Mickey Mouse, Wayward Sorcerer", "rarity": "Legendary", "inkType": "Steel", "inkCost": 8, "isInkable": false, "cardType": "Character", "text": "ANIMATE BROOM...", "template": "StandardCharacter", "strength": 3, "willpower": 4, "lore": 2, "keywords": ["ANIMATE_BROOM", "CEASELESS_WORKER"], "costReduction": 10
    },
    // --- PLAYER B's DEFENDER ---
    {
        "id": "C1-168",
        "name": "Simba, Protective Cub",
        "inkType": "Amber", 
        "inkCost": 2, 
        "isInkable": false, // *** FIX: Force AI to Play this, not Ink it ***
        "cardType": "Character",
        "text": "Lore: 1",
        "template": "StandardCharacter", 
        "strength": 2,
        "willpower": 2, 
        "lore": 1, 
        "keywords": []
    },
    // --- PLAYER A's ATTACKER ---
    {
        "id": "C1-073",
        "name": "Goofy, Daredevil",
        "inkType": "Emerald", 
        "inkCost": 4, 
        "isInkable": false, 
        "cardType": "Character",
        "text": "Lore: 1",
        "template": "StandardCharacter", 
        "strength": 3,
        "willpower": 5, 
        "lore": 1, 
        "keywords": []
    }
];