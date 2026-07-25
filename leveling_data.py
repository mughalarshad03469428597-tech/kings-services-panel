LEVELING_RATES = {
    # 🏃 01. AGILITY
    "01. Agility 1-50": (1500, calc_usd(1500), "🏃 Fast starter courses | Full Graceful focus"),
    "01. Agility 50-80": (850, calc_usd(850), "🏅 Seers Village | Max Marks of Grace"),
    "01. Agility 80-99": (500, calc_usd(500), "🏛️ Hallowed Sepulchre | Elite loot focus"),

    # ⚔️ 02. COMBAT (Attack/Str/Def)
    "02. Combat 1-70 (Crabs)": (1700, calc_usd(1700), "🦀 Safest low-level training | 100% Manual"),
    "02. Combat 70-99 (NMZ)": (600, calc_usd(600), "🛡️ Nightmare Zone experts | AFK & Ban-safe"),

    # 🏠 03. CONSTRUCTION
    "03. Construction 1-50": (3500, calc_usd(3500), "🏠 Fast Oak Plank pattern | Precise clicking"),
    "03. Construction 50-99": (1000, calc_usd(1000), "🏠 Mahogany Tables | Insane 800k+ XP/hr"),

    # 🍳 04. COOKING
    "04. Cooking 1-35": (1500, calc_usd(1500), "🍳 Instant starter levels | 100% Hand-trained"),
    "04. Cooking 35-99": (500, calc_usd(500), "🍳 1-Tick Karambwan speed | Fastest Cape"),

    # 💎 05. CRAFTING
    "05. Crafting 1-60": (1800, calc_usd(1800), "💎 Rapid gem cutting | Fast bankstanding"),
    "05. Crafting 60-99": (700, calc_usd(700), "💎 Air Battlestaffs | High XP/hr efficiency"),

    # 🌳 06. FARMING
    "06. Farming (Tree Runs)": (600, calc_usd(600), "🌳 Daily login management | All loot saved"),
    "06. Farming (Tithe Farm)": (5000, calc_usd(5000), "🌾 Active grind | Fast Seed-box unlock"),

    # 🔥 07. FIREMAKING
    "07. Firemaking 1-50": (4500, calc_usd(4500), "🔥 Quick log burning | Rapid jumpstart"),
    "07. Firemaking 50-99": (1000, calc_usd(1000), "🔥 Wintertodt masters | All crates kept"),

    # 🎣 08. FISHING
    "08. Fishing 1-50": (6000, calc_usd(6000), "🎣 Fly-fishing speed | Efficient starter"),
    "08. Fishing 50-99": (2500, calc_usd(2500), "🌊 Barbarian/Tempross | Optimal tick-manipulation"),

    # 🏹 09. FLETCHING
    "09. Fletching 1-50": (1200, calc_usd(1200), "🏹 Fast bows/darts | Bankstanding pro"),
    "09. Fletching 50-99": (400, calc_usd(400), "🏹 Instant XP | Maximum delivery speed"),

    # 🧪 10. HERBLORE
    "10. Herblore 1-50": (1500, calc_usd(1500), "🧪 Rapid potion making | 100% Manual labor"),
    "10. Herblore 50-99": (700, calc_usd(700), "🧪 1M+ XP/hr bank speed | Reliable grind"),

    # ❤️ 11. HITPOINTS
    "11. Hitpoints 1-99": (700, calc_usd(700), "❤️ Passive focus | Trained with Combat"),

    # 🐍 12. HUNTER
    "12. Hunter 1-63": (7500, calc_usd(7500), "🐾 Sallies & Bird-houses | Expert trapping"),
    "12. Hunter 63-99": (3500, calc_usd(3500), "🐀 Black Chins | Max catch rate efficiency"),

    # ⚡ 13. MAGIC
    "13. Magic 1-55": (3500, calc_usd(3500), "⚡ Splash/Teleport | Reliable hand-training"),
    "13. Magic 55-99": (800, calc_usd(800), "⚡ MM2 Bursting | Max XP/hr & Safe execution"),

    # ⛏️ 14. MINING
    "14. Mining 1-30": (35000, calc_usd(35000), "⛏️ Fast Iron power-mining | Instant start"),
    "14. Mining 30-72": (6000, calc_usd(6000), "⛏️ Motherlode Mine | All resources kept"),
    "14. Mining 72-99": (3500, calc_usd(3500), "⛏️ Amethyst/VM | High efficiency & Pet focus"),

    # 🏰 15. PRAYER
    "15. Prayer 1-70": (800, calc_usd(800), "🏰 Chaos Altar focus | 50% Bones saved"),
    "15. Prayer 70-99": (500, calc_usd(500), "🏰 Gilded Altar safety | 100% Safe XP"),

    # 🎯 16. RANGED
    "16. Ranged 1-50": (3500, calc_usd(3500), "🎯 Fast Cannon/Bow training | 100% Safe"),
    "16. Ranged 50-99": (700, calc_usd(700), "🎯 Elite MM2 positioning | Insane Chinning speed"),

    # 🔮 17. RUNECRAFTING
    "17. Runecrafting 1-77": (8500, calc_usd(8500), "🔮 Guardians of the Rift | All rewards kept"),
    "17. Runecrafting 77-99": (3500, calc_usd(3500), "🔮 Blood/Soul Runes | High profit focus"),

    # ⛵ 18. SAILING (Coming Soon)
    "18. Sailing 1-50": (25000, calc_usd(25000), "⛵ Coastal Navigation | New Skill Expert"),
    "18. Sailing 50-99": (12000, calc_usd(12000), "⛵ Deep Sea Master | Hull & Sail optimization"),

    # 💀 19. SLAYER
    "19. Slayer 1-50": (7500, calc_usd(7500), "💀 Low level efficiency | Smart task skips"),
    "19. Slayer 50-85": (5500, calc_usd(5500), "💀 High profit focus | Cannon/Bursting used"),
    "19. Slayer 85-99": (4000, calc_usd(4000), "💀 Abyssal/Superior tasks | Max GP & XP focus"),

    # ⚒️ 20. SMITHING
    "20. Smithing 1-30": (3500, calc_usd(3500), "⚒️ Fast Knight's Sword & Anvils"),
    "20. Smithing 30-99": (1500, calc_usd(1500), "⚒️ Blast Furnace pro | Optimal bar management"),

    # 🧤 21. THIEVING
    "21. Thieving 1-45": (12500, calc_usd(12500), "🧤 Fast Blackjacking | No fail technique"),
    "21. Thieving 45-91": (5000, calc_usd(5000), "🧤 Ardy Knights | Highly safe & reliable"),
    "21. Thieving 91-99": (3000, calc_usd(3000), "🧤 Master Farmers | Max seed loot kept"),

    # 🪓 22. WOODCUTTING
    "22. Woodcutting 1-61": (4000, calc_usd(4000), "🪓 Fast Willow/Teak jumpstart | Manual"),
    "22. Woodcutting 61-99": (2200, calc_usd(2200), "🪓 Redwoods/Tick-Teaks | Maximum efficiency"),
}
