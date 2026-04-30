var gameData = {
    taskData: {},
    itemData: {},

    coins: 0,
    days: 365 * 14,
    evil: 0,
    paused: false,
    timeWarpingEnabled: true,

    rebirthOneCount: 0,
    rebirthTwoCount: 0,

    currentJob: null,
    currentSkill: null,
    currentProperty: null,
    currentMisc: null,
}

var tempData = {}

var skillWithLowestMaxXp = null

const autoPromoteElement = document.getElementById("autoPromote")
const autoLearnElement = document.getElementById("autoLearn")

const updateSpeed = 20

const baseLifespan = 365 * 70

const baseGameSpeed = 20

const permanentUnlocks = ["Scheduling", "Shop", "Automation", "Quick task display"]

const jobBaseData = {
    "Beggar": {name: "Beggar", maxXp: 50, income: 5},
    "Farmer": {name: "Farmer", maxXp: 100, income: 9},
    "Stable hand": {name: "Stable hand", maxXp: 140, income: 12},
    "Fisherman": {name: "Fisherman", maxXp: 210, income: 18},
    "Woodcutter": {name: "Woodcutter", maxXp: 300, income: 28},
    "Miner": {name: "Miner", maxXp: 460, income: 48},
    "Blacksmith": {name: "Blacksmith", maxXp: 850, income: 90},
    "Merchant": {name: "Merchant", maxXp: 1650, income: 165},

    "Squire": {name: "Squire", maxXp: 100, income: 5},
    "Footman": {name: "Footman", maxXp: 1000, income: 50},
    "Veteran footman": {name: "Veteran footman", maxXp: 10000, income: 120},
    "Knight": {name: "Knight", maxXp: 100000, income: 300},
    "Veteran knight": {name: "Veteran knight", maxXp: 1000000, income: 1000},
    "Elite knight": {name: "Elite knight", maxXp: 7500000, income: 3000},
    "Holy knight": {name: "Holy knight", maxXp: 40000000, income: 15000},
    "Legendary knight": {name: "Legendary knight", maxXp: 150000000, income: 50000},

    "Student": {name: "Student", maxXp: 45000, income: 100},
    "Apprentice mage": {name: "Apprentice mage", maxXp: 180000, income: 1000},
    "Mage": {name: "Mage", maxXp: 650000, income: 7500},
    "Wizard": {name: "Wizard", maxXp: 2200000, income: 50000},
    "Master wizard": {name: "Master wizard", maxXp: 8500000, income: 250000},
    "Chairman": {name: "Chairman", maxXp: 42000000, income: 1000000},

    "Ruin acolyte": {name: "Ruin acolyte", maxXp: 4500, income: 380},
    "Hex collector": {name: "Hex collector", maxXp: 18000, income: 1700},
    "Soul broker": {name: "Soul broker", maxXp: 90000, income: 8000},
    "Abyssal knight": {name: "Abyssal knight", maxXp: 450000, income: 33000},
    "Infernal architect": {name: "Infernal architect", maxXp: 2500000, income: 130000},
    "Reality heretic": {name: "Reality heretic", maxXp: 12000000, income: 550000},
}

const skillBaseData = {
    "Concentration": {name: "Concentration", maxXp: 100, effect: 0.01, description: "Skill xp"},
    "Productivity": {name: "Productivity", maxXp: 100, effect: 0.01, description: "Job xp"},
    "Patience": {name: "Patience", maxXp: 120, effect: 0.006, description: "Skill xp"},
    "Bargaining": {name: "Bargaining", maxXp: 100, effect: -0.01, description: "Expenses"},
    "Frugality": {name: "Frugality", maxXp: 110, effect: -0.006, description: "Expenses"},
    "Diligence": {name: "Diligence", maxXp: 140, effect: 0.006, description: "All xp"},
    "Meditation": {name: "Meditation", maxXp: 100, effect: 0.01, description: "Happiness"},
    "Curiosity": {name: "Curiosity", maxXp: 160, effect: 0.008, description: "Magic xp"},

    "Strength": {name: "Strength", maxXp: 100, effect: 0.01, description: "Military pay"},
    "Endurance": {name: "Endurance", maxXp: 120, effect: 0.006, description: "Longer lifespan"},
    "Weapon handling": {name: "Weapon handling", maxXp: 150, effect: 0.008, description: "Military xp"},
    "Battle tactics": {name: "Battle tactics", maxXp: 100, effect: 0.01, description: "Military xp"},
    "Muscle memory": {name: "Muscle memory", maxXp: 100, effect: 0.01, description: "Strength xp"},

    "Mana control": {name: "Mana control", maxXp: 100, effect: 0.01, description: "T.A.A. xp"},
    "Arcane theory": {name: "Arcane theory", maxXp: 180, effect: 0.008, description: "Magic xp"},
    "Immortality": {name: "Immortality", maxXp: 100, effect: 0.01, description: "Longer lifespan"},
    "Time warping": {name: "Time warping", maxXp: 100, effect: 0.01, description: "Gamespeed"},
    "Super immortality": {name: "Super immortality", maxXp: 100, effect: 0.01, description: "Longer lifespan"},

    "Dark influence": {name: "Dark influence", maxXp: 100, effect: 0.01, description: "All xp"},
    "Evil control": {name: "Evil control", maxXp: 100, effect: 0.01, description: "Evil gain"},
    "Intimidation": {name: "Intimidation", maxXp: 100, effect: -0.01, description: "Expenses"},
    "Demon training": {name: "Demon training", maxXp: 100, effect: 0.01, description: "All xp"},
    "Blood meditation": {name: "Blood meditation", maxXp: 100, effect: 0.01, description: "Evil gain"},
    "Demon's wealth": {name: "Demon's wealth", maxXp: 100, effect: 0.002, description: "Job pay"},
    "Soul binding": {name: "Soul binding", maxXp: 140, effect: 0.008, description: "Evil work xp"},
    "Dark haste": {name: "Dark haste", maxXp: 160, effect: 0.006, description: "Gamespeed"},
    "Grave vitality": {name: "Grave vitality", maxXp: 180, effect: 0.006, description: "Longer lifespan"},
    "Sin economy": {name: "Sin economy", maxXp: 170, effect: 0.006, description: "Evil work pay"},
    "Reality fracture": {name: "Reality fracture", maxXp: 220, effect: 0.005, description: "Metaverse gain"},

    "Dimensional mapping": {name: "Dimensional mapping", maxXp: 260, effect: 0.006, description: "Metaverse gain"},
    "Parallel discipline": {name: "Parallel discipline", maxXp: 280, effect: 0.005, description: "All xp"},
    "Chrono geometry": {name: "Chrono geometry", maxXp: 320, effect: 0.004, description: "Gamespeed"},
    "Echo longevity": {name: "Echo longevity", maxXp: 340, effect: 0.005, description: "Longer lifespan"},
    "Universe attunement": {name: "Universe attunement", maxXp: 380, effect: 0.006, description: "Passive MP"},

}

const itemBaseData = {
    "Homeless": {name: "Homeless", expense: 0, effect: 1},
    "Tent": {name: "Tent", expense: 12, effect: 1.28},
    "Wooden hut": {name: "Wooden hut", expense: 80, effect: 1.8},
    "Cottage": {name: "Cottage", expense: 850, effect: 3},
    "House": {name: "House", expense: 8500, effect: 5.2},
    "Large house": {name: "Large house", expense: 25000, effect: 12},
    "Small palace": {name: "Small palace", expense: 300000, effect: 25},
    "Grand palace": {name: "Grand palace", expense: 5000000, effect: 60},
    "Manor": {name: "Manor", expense: 25000000, effect: 95},
    "Guild hall": {name: "Guild hall", expense: 120000000, effect: 145},
    "Noble estate": {name: "Noble estate", expense: 750000000, effect: 230},
    "Royal keep": {name: "Royal keep", expense: 4000000000, effect: 360},
    "Ancient citadel": {name: "Ancient citadel", expense: 25000000000, effect: 560},
    "Sky crown palace": {name: "Sky crown palace", expense: 160000000000, effect: 850},

    "Cheap meal": {name: "Cheap meal", expense: 5, effect: 1.06, description: "Happiness"},
    "Notebook": {name: "Notebook", expense: 8, effect: 1.12, description: "Concentration xp"},
    "Book": {name: "Book", expense: 18, effect: 1.28, description: "Skill xp"},
    "Work gloves": {name: "Work gloves", expense: 24, effect: 1.14, description: "Common job xp"},
    "Ledger": {name: "Ledger", expense: 35, effect: 0.97, description: "Expenses"},
    "Fishing net": {name: "Fishing net", expense: 55, effect: 1.18, description: "Fisherman pay"},
    "Dumbbells": {name: "Dumbbells", expense: 70, effect: 1.35, description: "Strength xp"},
    "Training dummy": {name: "Training dummy", expense: 145, effect: 1.28, description: "Combat xp"},
    "Miner's lamp": {name: "Miner's lamp", expense: 180, effect: 1.18, description: "Mining pay"},
    "Meditation mat": {name: "Meditation mat", expense: 140, effect: 1.3, description: "Meditation xp"},
    "Personal squire": {name: "Personal squire", expense: 200, effect: 2, description: "Job xp"},
    "Steel longsword": {name: "Steel longsword", expense: 1000, effect: 2, description: "Military xp"},
    "Butler": {name: "Butler", expense: 7500, effect: 1.5, description: "Happiness"},
    "Sapphire charm": {name: "Sapphire charm", expense: 50000, effect: 3, description: "Magic xp"},
    "Arcane focus": {name: "Arcane focus", expense: 180000, effect: 1.8, description: "Magic xp"},
    "Royal ledger": {name: "Royal ledger", expense: 450000, effect: 1.25, description: "Job pay"},
    "Study desk": {name: "Study desk", expense: 1000000, effect: 2, description: "Skill xp"},
    "Library": {name: "Library", expense: 10000000, effect: 1.5, description: "Skill xp"},
}

const jobCategories = {
    "Common work": ["Beggar", "Farmer", "Stable hand", "Fisherman", "Woodcutter", "Miner", "Blacksmith", "Merchant"],
    "Military" : ["Squire", "Footman", "Veteran footman", "Knight", "Veteran knight", "Elite knight", "Holy knight", "Legendary knight"],
    "The Arcane Association" : ["Student", "Apprentice mage", "Mage", "Wizard", "Master wizard", "Chairman"],
    "Evil work": ["Ruin acolyte", "Hex collector", "Soul broker", "Abyssal knight", "Infernal architect", "Reality heretic"]
}

const skillCategories = {
    "Fundamentals": ["Concentration", "Productivity", "Patience", "Bargaining", "Frugality", "Diligence", "Meditation", "Curiosity"],
    "Combat": ["Strength", "Endurance", "Weapon handling", "Battle tactics", "Muscle memory"],
    "Magic": ["Mana control", "Arcane theory", "Immortality", "Time warping", "Super immortality"],
    "Dark magic": ["Dark influence", "Evil control", "Intimidation", "Demon training", "Blood meditation", "Demon's wealth", "Soul binding", "Dark haste", "Grave vitality", "Sin economy", "Reality fracture"],
    "Multiverse": ["Dimensional mapping", "Parallel discipline", "Chrono geometry", "Echo longevity", "Universe attunement"]
}

const itemCategories = {
    "Properties": ["Homeless", "Tent", "Wooden hut", "Cottage", "House", "Large house", "Small palace", "Grand palace", "Manor", "Guild hall", "Noble estate", "Royal keep", "Ancient citadel", "Sky crown palace"],
    "Misc": ["Cheap meal", "Notebook", "Book", "Work gloves", "Ledger", "Fishing net", "Dumbbells", "Training dummy", "Miner's lamp", "Meditation mat", "Personal squire", "Steel longsword", "Butler", "Sapphire charm", "Arcane focus", "Royal ledger", "Study desk", "Library"]
}

const headerRowColors = {
    "Common work": "#55a630",
    "Military": "#e63946",
    "The Arcane Association": "#C71585",
    "Evil work": "#9b111e",
    "Fundamentals": "#4a4e69",
    "Combat": "#ff704d",
    "Magic": "#875F9A",
    "Dark magic": "#73000f",
    "Multiverse": "#3a6ea5",
    "Properties": "#219ebc",
    "Misc": "#b56576",
}

const tooltips = {
    "Beggar": "Struggle day and night for a couple of copper coins. It feels like you are at the brink of death each day.",
    "Farmer": "Plow the fields and grow the crops. It's not much but it's honest work.",
    "Stable hand": "Clean stalls, carry feed and learn the rhythm of steady work around the town stables.",
    "Fisherman": "Reel in various fish and sell them for a handful of coins. A relaxing but still a poor paying job.",
    "Woodcutter": "Chop timber for builders and craftsmen. The work is tiring, but the pay is steadier than fishing.",
    "Miner": "Delve into dangerous caverns and mine valuable ores. The pay is quite meager compared to the risk involved.",
    "Blacksmith": "Smelt ores and carefully forge weapons for the military. A respectable and OK paying commoner job.",
    "Merchant": "Travel from town to town, bartering fine goods. The job pays decently well and is a lot less manually-intensive.",

    "Squire": "Carry around your knight's shield and sword along the battlefield. Very meager pay but the work experience is quite valuable.",
    "Footman": "Put down your life to battle with enemy soldiers. A courageous, respectable job but you are still worthless in the grand scheme of things.",
    "Veteran footman": "More experienced and useful than the average footman, take out the enemy forces in battle with your might. The pay is not that bad.",
    "Knight": "Slash and pierce through enemy soldiers with ease, while covered in steel from head to toe. A decently paying and very respectable job.",
    "Veteran knight": "Utilising your unmatched combat ability, slaugher enemies effortlessly. Most footmen in the military would never be able to acquire such a well paying job like this.",
    "Elite knight": "Obliterate squadrons of enemy soldiers in one go with extraordinary proficiency, while equipped with the finest gear. Such a feared unit on the battlefield is paid extremely well.",
    "Holy knight": "Collapse entire armies in mere seconds with your magically imbued blade. The handful of elite knights who attain this level of power are showered with coins.",
    "Legendary knight": "Feared worldwide, obliterate entire nations in a blink of an eye. Roughly every century, only one holy knight is worthy of receiving such an esteemed title.",

    "Student": "Study the theory of mana and practice basic spells. There is minor pay to cover living costs, however, this is a necessary stage in becoming a mage.",
    "Apprentice mage": "Under the supervision of a mage, perform basic spells against enemies in battle. Generous pay will be provided to cover living costs.",
    "Mage": "Turn the tides of battle through casting intermediate spells and mentor other apprentices. The pay for this particular job is extremely high.",
    "Wizard": "Utilise advanced spells to ravage and destroy entire legions of enemy soldiers. Only a small percentage of mages deserve to attain this role and are rewarded with an insanely high pay.",
    "Master wizard": "Blessed with unparalleled talent, perform unbelievable feats with magic at will. It is said that a master wizard has enough destructive power to wipe an empire off the map.",
    "Chairman": "Spend your days administrating The Arcane Association and investigate the concepts of true immortality. The chairman receives ludicrous amounts of pay daily.",

    "Ruin acolyte": "Serve small forbidden cults and learn how evil turns fear into income.",
    "Hex collector": "Collect cursed debts for patrons who prefer silence over paperwork.",
    "Soul broker": "Trade favors, names and fragments of souls in a market nobody admits exists.",
    "Abyssal knight": "Fight as a dark champion where ordinary military discipline no longer applies.",
    "Infernal architect": "Build ritual engines that turn wealth, fear and time into structured power.",
    "Reality heretic": "Preach against the laws of the current world and prepare the first cracks toward the multiverse.",

    "Concentration": "Improve your learning speed through practising intense concentration activities.",
    "Productivity": "Learn to procrastinate less at work and receive more job experience per day.",
    "Patience": "Train yourself to endure slow progress without losing focus, improving long study sessions.",
    "Bargaining": "Study the tricks of the trade and persuasive skills to lower any type of expense.",
    "Frugality": "Track wasteful habits and stretch every coin further before wealth arrives.",
    "Diligence": "Build a strict daily rhythm that makes both work and training more consistent.",
    "Meditation": "Fill your mind with peace and tranquility to tap into greater happiness from within.",
    "Curiosity": "Ask dangerous questions about mana, preparing the mind for arcane study.",

    "Strength": "Condition your body and strength through harsh training. Stronger individuals are paid more in the military.",
    "Endurance": "Temper your body through long marches and sleepless nights, slightly extending your useful years.",
    "Weapon handling": "Practice grip, stance and blade control before complex battle tactics.",
    "Battle tactics": "Create and revise battle strategies, improving experience gained in the military.",
    "Muscle memory": "Strengthen your neurons through habit and repetition, improving strength gains throughout the body.",

    "Mana control": "Strengthen your mana channels throughout your body, aiding you in becoming a more powerful magical user.",
    "Arcane theory": "Study the structure of spells before trying to bend life and time.",
    "Immortality": "Lengthen your lifespan through the means of magic. However, is this truly the immortality you have tried seeking for...?",
    "Time warping": "Bend space and time through forbidden techniques, resulting in a faster gamespeed.",
    "Super immortality": "Through harnessing ancient, forbidden techniques, lengthen your lifespan drastically beyond comprehension.",

    "Dark influence": "Encompass yourself with formidable power bestowed upon you by evil, allowing you to pick up and absorb any job or skill with ease.",
    "Evil control": "Tame the raging and growing evil within you, improving evil gain in-between rebirths.",
    "Intimidation": "Learn to emit a devilish aura which strikes extreme fear into other merchants, forcing them to give you heavy discounts.",
    "Demon training": "A mere human body is too feeble and weak to withstand evil. Train with forbidden methods to slowly manifest into a demon, capable of absorbing knowledge rapidly.",
    "Blood meditation": "Grow and culture the evil within you through the sacrifise of other living beings, drastically increasing evil gain.",
    "Demon's wealth": "Through the means of dark magic, multiply the raw matter of the coins you receive from your job.",
    "Soul binding": "Bind fragments of yourself to darker work, improving evil job experience.",
    "Dark haste": "Let evil chew through wasted moments, increasing game speed without replacing time magic.",
    "Grave vitality": "Keep the body moving through bleak rituals, extending lifespan during evil progression.",
    "Sin economy": "Learn how fear, favors and forbidden contracts make evil work pay better.",
    "Reality fracture": "Study the first tiny cracks in causality, improving Metaverse gains after Reality Break.",

    "Dimensional mapping": "Chart the structure of unlocked universes, improving Metaverse gains.",
    "Parallel discipline": "Train routines that remain useful across realities, improving all XP.",
    "Chrono geometry": "Learn the shape of time between universes, increasing game speed in the multiverse.",
    "Echo longevity": "Anchor fragments of long lives across realities, extending lifespan.",
    "Universe attunement": "Tune each universe record into a steadier passive Metaverse income.",

    "Homeless": "Sleep on the uncomfortable, filthy streets while almost freezing to death every night. It cannot get any worse than this.",
    "Tent": "A thin sheet of tattered cloth held up by a couple of feeble, wooden sticks. Horrible living conditions but at least you have a roof over your head.",
    "Wooden hut": "Shabby logs and dirty hay glued together with horse manure. Much more sturdy than a tent, however, the stench isn't very pleasant.",
    "Cottage": "Structured with a timber frame and a thatched roof. Provides decent living conditions for a fair price.",
    "House": "A building formed from stone bricks and sturdy timber, which contains a few rooms. Although quite expensive, it is a comfortable abode.",
    "Large house": "Much larger than a regular house, which boasts even more rooms and multiple floors. The building is quite spacious but comes with a hefty price tag.",
    "Small palace": "A very rich and meticulously built structure rimmed with fine metals such as silver. Extremely high expenses to maintain for a lavish lifestyle.",
    "Grand palace": "A grand residence completely composed of gold and silver. Provides the utmost luxurious and comfortable living conditions possible for a ludicrous price.",
    "Manor": "A landed manor with servants, gardens and quiet rooms fit for long studies.",
    "Guild hall": "A prestigious hall where trade contacts and craftsmen gather under your banner.",
    "Noble estate": "A sprawling estate that turns noble comfort into a real training advantage.",
    "Royal keep": "A fortified royal residence with archives, guards and private chambers.",
    "Ancient citadel": "An old fortress layered with history, discipline and forbidden rooms.",
    "Sky crown palace": "A mythic palace above the clouds, built for a ruler who no longer belongs to ordinary life.",

    "Cheap meal": "Simple food that keeps you steady through the first years of training.",
    "Notebook": "A rough notebook for tracking lessons, errands and small observations.",
    "Book": "A place to write down all your thoughts and discoveries, allowing you to learn a lot more quickly.",
    "Work gloves": "Cheap gloves that prevent small injuries and make common labor more consistent.",
    "Ledger": "A small accounting ledger that helps catch waste before it drains your purse.",
    "Fishing net": "A proper net that makes fishing less dependent on luck.",
    "Dumbbells": "Heavy tools used in strenuous exercise to toughen up and accumulate strength even faster than before. ",
    "Training dummy": "A battered target for repeated strikes and basic combat conditioning.",
    "Miner's lamp": "A reliable lamp for safer and more profitable mining shifts.",
    "Meditation mat": "A quiet mat that makes daily meditation easier to keep consistent.",
    "Personal squire": "Assists you in completing day to day activities, giving you more time to be productive at work.",
    "Steel longsword": "A fine blade used to slay enemies even quicker in combat and therefore gain more experience.",
    "Butler": "Keeps your household clean at all times and also prepares three delicious meals per day, leaving you in a happier, stress-free mood.",
    "Sapphire charm": "Embedded with a rare sapphire, this charm activates more mana channels within your body, providing a much easier time learning magic.",
    "Arcane focus": "A tuned focus used to stabilize advanced mana exercises.",
    "Royal ledger": "An elite trade ledger that turns higher administration into better pay.",
    "Study desk": "A dedicated area which provides many fine stationary and equipment designed for furthering your progress in research.",
    "Library": "Stores a collection of books, each containing vast amounts of information from basic life skills to complex magic spells.",
}

const units = ["", "k", "M", "B", "T", "q", "Q", "Sx", "Sp", "Oc"];

const jobTabButton = document.getElementById("jobTabButton")

function getBaseLog(x, y) {
    return Math.log(y) / Math.log(x);
}
  
function getBindedTaskEffect(taskName) {
    var task = gameData.taskData[taskName]
    return task.getEffect.bind(task)
}

function getBindedItemEffect(itemName) {
    var item = gameData.itemData[itemName]
    return item.getEffect.bind(item)
}

function addMultipliers() {
    for (taskName in gameData.taskData) {
        var task = gameData.taskData[taskName]

        task.xpMultipliers = []
        if (task instanceof Job) task.incomeMultipliers = []

        task.xpMultipliers.push(task.getMaxLevelMultiplier.bind(task))
        task.xpMultipliers.push(getHappiness)
        task.xpMultipliers.push(getBindedTaskEffect("Dark influence"))
        task.xpMultipliers.push(getBindedTaskEffect("Demon training"))
        task.xpMultipliers.push(getBindedTaskEffect("Diligence"))
        task.xpMultipliers.push(getBindedTaskEffect("Parallel discipline"))

        if (task instanceof Job) {
            task.incomeMultipliers.push(task.getLevelMultiplier.bind(task))
            task.incomeMultipliers.push(getBindedTaskEffect("Demon's wealth"))
            task.xpMultipliers.push(getBindedTaskEffect("Productivity"))
            task.xpMultipliers.push(getBindedItemEffect("Personal squire"))
            if (jobCategories["Common work"].includes(task.name)) {
                task.xpMultipliers.push(getBindedItemEffect("Work gloves"))
            }
        } else if (task instanceof Skill) {
            task.xpMultipliers.push(getBindedTaskEffect("Concentration"))
            task.xpMultipliers.push(getBindedTaskEffect("Patience"))
            task.xpMultipliers.push(getBindedItemEffect("Book"))
            task.xpMultipliers.push(getBindedItemEffect("Study desk"))
            task.xpMultipliers.push(getBindedItemEffect("Library"))
        }

        if (jobCategories["Military"].includes(task.name)) {
            task.incomeMultipliers.push(getBindedTaskEffect("Strength"))
            task.incomeMultipliers.push(getBindedItemEffect("Royal ledger"))
            task.xpMultipliers.push(getBindedTaskEffect("Battle tactics"))
            task.xpMultipliers.push(getBindedTaskEffect("Weapon handling"))
            task.xpMultipliers.push(getBindedItemEffect("Steel longsword"))
        } else if (jobCategories["Evil work"].includes(task.name)) {
            task.incomeMultipliers.push(getBindedTaskEffect("Sin economy"))
            task.incomeMultipliers.push(getBindedTaskEffect("Demon's wealth"))
            task.xpMultipliers.push(getBindedTaskEffect("Soul binding"))
            task.xpMultipliers.push(getBindedTaskEffect("Demon training"))
        } else if (task.name == "Strength") {
            task.xpMultipliers.push(getBindedTaskEffect("Muscle memory"))
            task.xpMultipliers.push(getBindedItemEffect("Dumbbells"))
            task.xpMultipliers.push(getBindedItemEffect("Training dummy"))
        } else if (task.name == "Concentration") {
            task.xpMultipliers.push(getBindedItemEffect("Notebook"))
        } else if (task.name == "Meditation") {
            task.xpMultipliers.push(getBindedItemEffect("Meditation mat"))
        } else if (skillCategories["Magic"].includes(task.name)) {
            task.xpMultipliers.push(getBindedTaskEffect("Curiosity"))
            task.xpMultipliers.push(getBindedTaskEffect("Arcane theory"))
            task.xpMultipliers.push(getBindedItemEffect("Sapphire charm"))
            task.xpMultipliers.push(getBindedItemEffect("Arcane focus"))
        } else if (jobCategories["The Arcane Association"].includes(task.name)) {
            task.xpMultipliers.push(getBindedTaskEffect("Mana control"))
            task.xpMultipliers.push(getBindedTaskEffect("Curiosity"))
            task.xpMultipliers.push(getBindedTaskEffect("Arcane theory"))
            task.xpMultipliers.push(getBindedItemEffect("Arcane focus"))
        } else if (skillCategories["Dark magic"].includes(task.name)) {
            task.xpMultipliers.push(getEvil)
        } else if (skillCategories["Multiverse"].includes(task.name)) {
            task.xpMultipliers.push(getBindedTaskEffect("Reality fracture"))
            task.xpMultipliers.push(getBindedTaskEffect("Dimensional mapping"))
        }

        if (task.name == "Fisherman") task.incomeMultipliers.push(getBindedItemEffect("Fishing net"))
        if (task.name == "Miner") task.incomeMultipliers.push(getBindedItemEffect("Miner's lamp"))
    }

    for (itemName in gameData.itemData) {
        var item = gameData.itemData[itemName]
        item.expenseMultipliers = []
        item.expenseMultipliers.push(getBindedTaskEffect("Bargaining"))
        item.expenseMultipliers.push(getBindedTaskEffect("Frugality"))
        item.expenseMultipliers.push(getBindedTaskEffect("Intimidation"))
        item.expenseMultipliers.push(getBindedItemEffect("Ledger"))
    }
}

function setCustomEffects() {
    function expenseReduction(level, base, floor) {
        var multiplier = 1 - getBaseLog(base, level + 1) / 10
        return Math.max(floor, multiplier)
    }

    var bargaining = gameData.taskData["Bargaining"]
    bargaining.getEffect = function() {
        return expenseReduction(bargaining.level, 7, 0.55)
    }

    var frugality = gameData.taskData["Frugality"]
    frugality.getEffect = function() {
        return expenseReduction(frugality.level, 8, 0.68)
    }

    var intimidation = gameData.taskData["Intimidation"]
    intimidation.getEffect = function() {
        return expenseReduction(intimidation.level, 6, 0.6)
    }

    var timeWarping = gameData.taskData["Time warping"]
    timeWarping.getEffect = function() {
        var multiplier = 1 + getBaseLog(13, timeWarping.level + 1) 
        return multiplier
    }

    var immortality = gameData.taskData["Immortality"]
    immortality.getEffect = function() {
        var multiplier = 1 + getBaseLog(33, immortality.level + 1)
        return multiplier
    }

    var endurance = gameData.taskData["Endurance"]
    endurance.getEffect = function() {
        var multiplier = 1 + getBaseLog(40, endurance.level + 1) / 2
        return multiplier
    }
}

function getHappiness() {
    var meditationEffect = getBindedTaskEffect("Meditation")
    var butlerEffect = getBindedItemEffect("Butler")
    var happiness = meditationEffect() * butlerEffect() * gameData.currentProperty.getEffect()
    return happiness
}

function getEvil() {
    return gameData.evil
}

function applyMultipliers(value, multipliers) {
    var finalMultiplier = 1
    multipliers.forEach(function(multiplierFunction) {
        var multiplier = multiplierFunction()
        finalMultiplier *= multiplier
    })
    var finalValue = Math.round(value * finalMultiplier)
    return finalValue
}

function applySpeed(value) {
    finalValue = value * getGameSpeed() / updateSpeed
    return finalValue
}

function getEvilGain() {
    var evilControl = gameData.taskData["Evil control"]
    var bloodMeditation = gameData.taskData["Blood meditation"]
    var evil = Math.max(1, Math.floor(evilControl.getEffect() * bloodMeditation.getEffect()))
    return evil
}

function getGameSpeed() {
    var timeWarping = gameData.taskData["Time warping"]
    var timeWarpingSpeed = gameData.timeWarpingEnabled ? timeWarping.getEffect() : 1
    var darkHaste = gameData.taskData["Dark haste"] ? gameData.taskData["Dark haste"].getEffect() : 1
    var gameSpeed = baseGameSpeed * +!gameData.paused * +isAlive() * timeWarpingSpeed * darkHaste
    return gameSpeed
}

function applyExpenses() {
    var coins = applySpeed(getExpense())
    gameData.coins -= coins
    if (gameData.coins < 0) {    
        goBankrupt()
    }
}

function getExpense() {
    var expense = 0
    expense += gameData.currentProperty.getExpense()
    for (misc of gameData.currentMisc) {
        expense += misc.getExpense()
    }
    return expense
}

function goBankrupt() {
    gameData.coins = 0
    gameData.currentProperty = gameData.itemData["Homeless"]
    gameData.currentMisc = []
}

function setTab(element, selectedTab) {

    var tabs = Array.prototype.slice.call(document.getElementsByClassName("tab"))
    tabs.forEach(function(tab) {
        tab.style.display = "none"
    })
    document.getElementById(selectedTab).style.display = "block"

    var tabButtons = document.getElementsByClassName("tabButton")
    for (tabButton of tabButtons) {
        tabButton.classList.remove("w3-blue-gray")
    }
    element.classList.add("w3-blue-gray")
}

function setPause() {
    gameData.paused = !gameData.paused
}

function setTimeWarping() {
    gameData.timeWarpingEnabled = !gameData.timeWarpingEnabled
}

function setTask(taskName) {
    var task = gameData.taskData[taskName]
    task instanceof Job ? gameData.currentJob = task : gameData.currentSkill = task
}

function setProperty(propertyName) {
    var property = gameData.itemData[propertyName]
    gameData.currentProperty = property
}

function setMisc(miscName) {
    var misc = gameData.itemData[miscName]
    if (gameData.currentMisc.includes(misc)) {
        for (i = 0; i < gameData.currentMisc.length; i++) {
            if (gameData.currentMisc[i] == misc) {
                gameData.currentMisc.splice(i, 1)
            }
        }
    } else {
        gameData.currentMisc.push(misc)
    }
}

function createData(data, baseData) {
    for (key in baseData) {
        var entity = baseData[key]
        createEntity(data, entity)
    }
}

function createEntity(data, entity) {
    if ("income" in entity) {data[entity.name] = new Job(entity)}
    else if ("maxXp" in entity) {data[entity.name] = new Skill(entity)}
    else {data[entity.name] = new Item(entity)}
    data[entity.name].id = "row " + entity.name
}

function createRequiredRow(categoryName) {
    var requiredRow = document.getElementsByClassName("requiredRowTemplate")[0].content.firstElementChild.cloneNode(true)
    requiredRow.classList.add("requiredRow")
    requiredRow.classList.add(removeSpaces(categoryName))
    requiredRow.id = categoryName
    return requiredRow
}

function createHeaderRow(templates, categoryType, categoryName) {
    var headerRow = templates.headerRow.content.firstElementChild.cloneNode(true)
    headerRow.getElementsByClassName("category")[0].textContent = categoryName
    if (categoryType != itemCategories) {
        headerRow.getElementsByClassName("valueType")[0].textContent = categoryType == jobCategories ? "Income/day" : "Effect"
    }

    headerRow.style.backgroundColor = headerRowColors[categoryName]
    headerRow.style.color = "#ffffff"
    headerRow.classList.add(removeSpaces(categoryName))
    headerRow.classList.add("headerRow")
    
    return headerRow
}

function createRow(templates, name, categoryName, categoryType) {
    var row = templates.row.content.firstElementChild.cloneNode(true)
    row.getElementsByClassName("name")[0].textContent = name
    row.getElementsByClassName("tooltipText")[0].textContent = tooltips[name]
    row.id = "row " + name
    if (categoryType != itemCategories) {
        row.getElementsByClassName("progressBar")[0].onclick = function() {setTask(name)}
    } else {
        row.getElementsByClassName("button")[0].onclick = categoryName == "Properties" ? function() {setProperty(name)} : function() {setMisc(name)}
    }

    return row
}

function createAllRows(categoryType, tableId) {
    var templates = {
        headerRow: document.getElementsByClassName(categoryType == itemCategories ? "headerRowItemTemplate" : "headerRowTaskTemplate")[0],
        row: document.getElementsByClassName(categoryType == itemCategories ? "rowItemTemplate" : "rowTaskTemplate")[0],
    }

    var table = document.getElementById(tableId)

    for (categoryName in categoryType) {
        var headerRow = createHeaderRow(templates, categoryType, categoryName)
        table.appendChild(headerRow)
        
        var category = categoryType[categoryName]
        category.forEach(function(name) {
            var row = createRow(templates, name, categoryName, categoryType)
            table.appendChild(row)       
        })

        var requiredRow = createRequiredRow(categoryName)
        table.append(requiredRow)
    }
}

function updateQuickTaskDisplay(taskType) {
    var currentTask = taskType == "job" ? gameData.currentJob : gameData.currentSkill
    var quickTaskDisplayElement = document.getElementById("quickTaskDisplay")
    var progressBar = quickTaskDisplayElement.getElementsByClassName(taskType)[0]
    progressBar.getElementsByClassName("name")[0].textContent = currentTask.name + " lvl " + currentTask.level
    progressBar.getElementsByClassName("progressFill")[0].style.width = currentTask.xp / currentTask.getMaxXp() * 100 + "%"
}

function updateRequiredRows(data, categoryType) {
    var requiredRows = document.getElementsByClassName("requiredRow")
    for (requiredRow of requiredRows) {
        var nextEntity = null
        var category = categoryType[requiredRow.id] 
        if (category == null) {continue}
        for (i = 0; i < category.length; i++) {
            var entityName = category[i]
            if (i >= category.length - 1) break
            var requirements = gameData.requirements[entityName]
            if (requirements && i == 0) {
                if (!requirements.isCompleted()) {
                    nextEntity = data[entityName]
                    break
                }
            }

            var nextIndex = i + 1
            if (nextIndex >= category.length) {break}
            var nextEntityName = category[nextIndex]
            nextEntityRequirements = gameData.requirements[nextEntityName]

            if (!nextEntityRequirements.isCompleted()) {
                nextEntity = data[nextEntityName]
                break
            }       
        }

        if (nextEntity == null) {
            requiredRow.classList.add("hiddenTask")           
        } else {
            requiredRow.classList.remove("hiddenTask")
            var requirementObject = gameData.requirements[nextEntity.name]
            var requirements = requirementObject.requirements

            var coinElement = requiredRow.getElementsByClassName("coins")[0]
            var levelElement = requiredRow.getElementsByClassName("levels")[0]
            var evilElement = requiredRow.getElementsByClassName("evil")[0]

            coinElement.classList.add("hiddenTask")
            levelElement.classList.add("hiddenTask")
            evilElement.classList.add("hiddenTask")

            var finalText = ""
            if (data == gameData.taskData) {
                if (requirementObject instanceof EvilRequirement) {
                    evilElement.classList.remove("hiddenTask")
                    evilElement.textContent = format(requirements[0].requirement) + " evil"
                } else if (typeof RealityRequirement !== "undefined" && requirementObject instanceof RealityRequirement) {
                    levelElement.classList.remove("hiddenTask")
                    levelElement.textContent = " Reality Break"
                } else {
                    levelElement.classList.remove("hiddenTask")
                    for (requirement of requirements) {
                        var task = gameData.taskData[requirement.task]
                        if (!task) continue
                        if (task.level >= requirement.requirement) continue
                        var text = " " + requirement.task + " level " + format(task.level) + "/" + format(requirement.requirement) + ","
                        finalText += text
                    }
                    finalText = finalText.substring(0, finalText.length - 1)
                    levelElement.textContent = finalText
                }
            } else if (data == gameData.itemData) {
                coinElement.classList.remove("hiddenTask")
                formatCoins(requirements[0].requirement, coinElement)
            }
        }   
    }
}

function updateTaskRows() {
    for (key in gameData.taskData) {
        var task = gameData.taskData[key]
        var row = document.getElementById("row " + task.name)
        if (!row) continue
        row.getElementsByClassName("level")[0].textContent = task.level
        row.getElementsByClassName("xpGain")[0].textContent = format(task.getXpGain())
        row.getElementsByClassName("xpLeft")[0].textContent = format(task.getXpLeft())

        var maxLevel = row.getElementsByClassName("maxLevel")[0]
        maxLevel.textContent = task.maxLevel
        gameData.rebirthOneCount > 0 ? maxLevel.classList.remove("hidden") : maxLevel.classList.add("hidden")

        var progressFill = row.getElementsByClassName("progressFill")[0]
        progressFill.style.width = task.xp / task.getMaxXp() * 100 + "%"
        task == gameData.currentJob || task == gameData.currentSkill ? progressFill.classList.add("current") : progressFill.classList.remove("current")

        var valueElement = row.getElementsByClassName("value")[0]
        valueElement.getElementsByClassName("income")[0].style.display = task instanceof Job
        valueElement.getElementsByClassName("effect")[0].style.display = task instanceof Skill

        var skipSkillElement = row.getElementsByClassName("skipSkill")[0]
        skipSkillElement.style.display = task instanceof Skill && autoLearnElement.checked ? "block" : "none"

        if (task instanceof Job) {
            formatCoins(task.getIncome(), valueElement.getElementsByClassName("income")[0])
        } else {
            valueElement.getElementsByClassName("effect")[0].textContent = task.getEffectDescription()
        }
    }
}

function updateItemRows() {
    for (key in gameData.itemData) {
        var item = gameData.itemData[key]
        var row = document.getElementById("row " + item.name)
        if (!row) continue
        var button = row.getElementsByClassName("button")[0]
        button.disabled = gameData.coins < item.getExpense()
        var active = row.getElementsByClassName("active")[0]
        var color = itemCategories["Properties"].includes(item.name) ? headerRowColors["Properties"] : headerRowColors["Misc"]
        active.style.backgroundColor = gameData.currentMisc.includes(item) || item == gameData.currentProperty ? color : "white"
        row.getElementsByClassName("effect")[0].textContent = item.getEffectDescription()
        formatCoins(item.getExpense(), row.getElementsByClassName("expense")[0])
    }
}

function updateHeaderRows(categories) {
    for (categoryName in categories) {
        var className = removeSpaces(categoryName)
        var headerRow = document.getElementsByClassName(className)[0]
        if (!headerRow) continue
        var maxLevelElement = headerRow.getElementsByClassName("maxLevel")[0]
        if (maxLevelElement) gameData.rebirthOneCount > 0 ? maxLevelElement.classList.remove("hidden") : maxLevelElement.classList.add("hidden")
        var skipSkillElement = headerRow.getElementsByClassName("skipSkill")[0]
        if (skipSkillElement) skipSkillElement.style.display = categories == skillCategories && autoLearnElement.checked ? "block" : "none"
    }
}

function updateText() {
    //Sidebar
    updateResourceVisibility()
    document.getElementById("ageDisplay").textContent = daysToYears(gameData.days)
    document.getElementById("dayDisplay").textContent = getDay()
    document.getElementById("lifespanDisplay").textContent = daysToYears(getLifespan())
    document.getElementById("pauseButton").textContent = gameData.paused ? "Play" : "Pause"

    formatCoins(gameData.coins, document.getElementById("coinDisplay"))
    setSignDisplay()
    formatCoins(getNet(), document.getElementById("netDisplay"))
    formatCoins(getIncome(), document.getElementById("incomeDisplay"))
    formatCoins(getExpense(), document.getElementById("expenseDisplay"))

    document.getElementById("happinessDisplay").textContent = getHappiness().toFixed(1)

    document.getElementById("evilDisplay").textContent = gameData.evil.toFixed(1)
    document.getElementById("evilGainDisplay").textContent = getEvilGain().toFixed(1)

    document.getElementById("timeWarpingDisplay").textContent = "x" + gameData.taskData["Time warping"].getEffect().toFixed(2)
    document.getElementById("timeWarpingButton").textContent = gameData.timeWarpingEnabled ? "Disable warp" : "Enable warp"
}

function setSignDisplay() {
    var signDisplay = document.getElementById("signDisplay")
    if (getIncome() > getExpense()) {
        signDisplay.textContent = "+"
        signDisplay.style.color = "green"
    } else if (getExpense() > getIncome()) {
        signDisplay.textContent = "-"
        signDisplay.style.color = "red"
    } else {
        signDisplay.textContent = ""
        signDisplay.style.color = "gray"
    }
}

function getNet() {
    var net = Math.abs(getIncome() - getExpense())
    return net
}

function hideEntities() {
    for (key in gameData.requirements) {
        var requirement = gameData.requirements[key]
        var completed = requirement.isCompleted()
        for (element of requirement.elements) {
            if (!element) continue
            if (completed) {
                element.classList.remove("hidden")
            } else {
                element.classList.add("hidden")
            }
        }
    }
}

function createItemData(baseData) {
    for (var item of baseData) {
        gameData.itemData[item.name] = "happiness" in item ? new Property(task) : new Misc(task)
        gameData.itemData[item.name].id = "item " + item.name
    }
}

function doCurrentTask(task) {
    task.increaseXp()
    if (task instanceof Job) {
        increaseCoins()
    }
}

function getIncome() {
    var income = 0
    income += gameData.currentJob.getIncome()
    return income
}

function increaseCoins() {
    var coins = applySpeed(getIncome())
    gameData.coins += coins
}

function daysToYears(days) {
    var years = Math.floor(days / 365)
    return years
}

function getCategoryFromEntityName(categoryType, entityName) {
    for (categoryName in categoryType) {
        var category = categoryType[categoryName]
        if (category.includes(entityName)) {
            return category
        }
    }
}

function getNextEntity(data, categoryType, entityName) {
    var category = getCategoryFromEntityName(categoryType, entityName)
    var nextIndex = category.indexOf(entityName) + 1
    if (nextIndex > category.length - 1) return null
    var nextEntityName = category[nextIndex]
    var nextEntity = data[nextEntityName]
    return nextEntity
}

function autoPromote() {
    if (!autoPromoteElement.checked) return
    var nextEntity = getNextEntity(gameData.taskData, jobCategories, gameData.currentJob.name)
    if (nextEntity == null) return
    var requirement = gameData.requirements[nextEntity.name]
    if (requirement.isCompleted()) gameData.currentJob = nextEntity
}

function checkSkillSkipped(skill) {
    var row = document.getElementById("row " + skill.name)
    if (!row) return false
    var isSkillSkipped = row.getElementsByClassName("checkbox")[0].checked
    return isSkillSkipped
}

function updateResourceVisibility() {
    var body = document.getElementById("body")
    if (!body) return
    var evilOpened = (gameData.evil || 0) > 0 || (gameData.rebirthTwoCount || 0) > 0
    if (evilOpened) {
        body.classList.add("rb-evil-opened")
    } else {
        body.classList.remove("rb-evil-opened")
    }
}

function setSkillWithLowestMaxXp() {
    var bestSkill = null
    var bestScore = Infinity

    for (skillName in gameData.taskData) {
        var skill = gameData.taskData[skillName]
        var requirement = gameData.requirements[skillName]
        var row = document.getElementById("row " + skill.name)
        if (!(skill instanceof Skill) || !requirement || !row) continue
        if (!requirement.isCompleted() || row.classList.contains("hidden") || checkSkillSkipped(skill)) continue

        var xpGain = Math.max(1, skill.getXpGain())
        var targetLevel = Math.ceil((skill.level + 1) / 10) * 10
        if (targetLevel <= skill.level) targetLevel = skill.level + 10

        var xpToTarget = Math.max(0, skill.getXpLeft())
        var projectedLevel = skill.level + 1
        while (projectedLevel < targetLevel) {
            xpToTarget += Math.round(skill.baseData.maxXp * (projectedLevel + 1) * Math.pow(1.01, projectedLevel))
            projectedLevel += 1
        }

        var trainingTime = xpToTarget / xpGain
        var blockPenalty = Math.floor(skill.level / 10) * 100000
        var score = blockPenalty + trainingTime

        if (score < bestScore) {
            bestScore = score
            bestSkill = skill
        }
    }

    skillWithLowestMaxXp = bestSkill || gameData.taskData["Concentration"]
}

function getKeyOfLowestValueFromDict(dict) {
    var values = []
    for (key in dict) {
        var value = dict[key]
        values.push(value)
    }

    values.sort(function(a, b){return a - b})

    for (key in dict) {
        var value = dict[key]
        if (value == values[0]) {
            return key
        }
    }
}

function autoLearn() {
    if (!autoLearnElement.checked || !skillWithLowestMaxXp) return
    gameData.currentSkill = skillWithLowestMaxXp
}

function yearsToDays(years) {
    var days = years * 365
    return days
}
 
function getDay() {
    var day = Math.floor(gameData.days - daysToYears(gameData.days) * 365)
    return day
}

function increaseDays() {
    var increase = applySpeed(1)
    gameData.days += increase
}

function format(number) {

    // what tier? (determines SI symbol)
    var tier = Math.log10(number) / 3 | 0;

    // if zero, we don't need a suffix
    if(tier == 0) return number;

    // get suffix and determine scale
    var suffix = units[tier];
    var scale = Math.pow(10, tier * 3);

    // scale the number
    var scaled = number / scale;

    // format number and add suffix
    return scaled.toFixed(1) + suffix;
}

function formatCoins(coins, element) {
    var tiers = ["p", "g", "s"]
    var colors = {
        "p": "#79b9c7",
        "g": "#E5C100",
        "s": "#a8a8a8",
        "c": "#a15c2f"
    }
    var leftOver = coins
    var i = 0
    for (tier of tiers) {
        var x = Math.floor(leftOver / Math.pow(10, (tiers.length - i) * 2))
        var leftOver = Math.floor(leftOver - x * Math.pow(10, (tiers.length - i) * 2))
        var text = format(String(x)) + tier + " "
        element.children[i].textContent = x > 0 ? text : ""
        element.children[i].style.color = colors[tier]
        i += 1
    }
    if (leftOver == 0 && coins > 0) {element.children[3].textContent = ""; return}
    var text = String(Math.floor(leftOver)) + "c"
    element.children[3].textContent = text
    element.children[3].style.color = colors["c"]
}

function getTaskElement(taskName) {
    var task = gameData.taskData[taskName]
    var element = document.getElementById(task.id)
    return element
}

function getItemElement(itemName) {
    var item = gameData.itemData[itemName]
    var element = document.getElementById(item.id)
    return element
}

function getElementsByClass(className) {
    var elements = document.getElementsByClassName(removeSpaces(className))
    return elements
}

function setLightDarkMode() {
    var body = document.getElementById("body")
    body.classList.contains("dark") ? body.classList.remove("dark") : body.classList.add("dark")
}

function removeSpaces(string) {
    var string = string.replace(/ /g, "")
    return string
}

function rebirthOne() {
    gameData.rebirthOneCount += 1

    rebirthReset()
}

function rebirthTwo() {
    gameData.rebirthTwoCount += 1
    gameData.evil += getEvilGain()

    rebirthReset()

    for (taskName in gameData.taskData) {
        var task = gameData.taskData[taskName]
        task.maxLevel = 0
    }    
}

function rebirthReset() {
    setTab(jobTabButton, "jobs")

    gameData.coins = 0
    gameData.days = 365 * 14
    gameData.currentJob = gameData.taskData["Beggar"]
    gameData.currentSkill = gameData.taskData["Concentration"]
    gameData.currentProperty = gameData.itemData["Homeless"]
    gameData.currentMisc = []

    for (taskName in gameData.taskData) {
        var task = gameData.taskData[taskName]
        if (task.level > task.maxLevel) task.maxLevel = task.level
        task.level = 0
        task.xp = 0
    }

    for (key in gameData.requirements) {
        var requirement = gameData.requirements[key]
        if (requirement.completed && permanentUnlocks.includes(key)) continue
        requirement.completed = false
    }
}

function getLifespan() {
    var immortality = gameData.taskData["Immortality"]
    var superImmortality = gameData.taskData["Super immortality"]
    var endurance = gameData.taskData["Endurance"]
    var graveVitality = gameData.taskData["Grave vitality"] ? gameData.taskData["Grave vitality"].getEffect() : 1
    var echoLongevity = gameData.taskData["Echo longevity"] ? gameData.taskData["Echo longevity"].getEffect() : 1
    var lifespan = baseLifespan * endurance.getEffect() * immortality.getEffect() * superImmortality.getEffect() * graveVitality * echoLongevity
    return lifespan
}

function isAlive() {
    var condition = gameData.days < getLifespan()
    var deathText = document.getElementById("deathText")
    if (!condition) {
        gameData.days = getLifespan()
        deathText.classList.remove("hidden")
    }
    else {
        deathText.classList.add("hidden")
    }
    return condition
}

function assignMethods() {

    for (key in gameData.taskData) {
        var task = gameData.taskData[key]
        if (task.baseData.income) {
            task.baseData = jobBaseData[task.name]
            task = Object.assign(new Job(jobBaseData[task.name]), task)
            
        } else {
            task.baseData = skillBaseData[task.name]
            task = Object.assign(new Skill(skillBaseData[task.name]), task)
        } 
        gameData.taskData[key] = task
    }

    for (key in gameData.itemData) {
        var item = gameData.itemData[key]
        item.baseData = itemBaseData[item.name]
        item = Object.assign(new Item(itemBaseData[item.name]), item)
        gameData.itemData[key] = item
    }

    for (key in gameData.requirements) {
        var requirement = gameData.requirements[key]
        if (requirement.type == "task") {
            requirement = Object.assign(new TaskRequirement(requirement.elements, requirement.requirements), requirement)
        } else if (requirement.type == "coins") {
            requirement = Object.assign(new CoinRequirement(requirement.elements, requirement.requirements), requirement)
        } else if (requirement.type == "age") {
            requirement = Object.assign(new AgeRequirement(requirement.elements, requirement.requirements), requirement)
        } else if (requirement.type == "evil") {
            requirement = Object.assign(new EvilRequirement(requirement.elements, requirement.requirements), requirement)
        } else if (requirement.type == "reality") {
            requirement = Object.assign(new RealityRequirement(requirement.elements, requirement.requirements), requirement)
        }

        var tempRequirement = tempData["requirements"][key]
        requirement.elements = tempRequirement.elements
        requirement.requirements = tempRequirement.requirements
        gameData.requirements[key] = requirement
    }

    gameData.currentJob = gameData.taskData[gameData.currentJob.name]
    gameData.currentSkill = gameData.taskData[gameData.currentSkill.name]
    gameData.currentProperty = gameData.itemData[gameData.currentProperty.name]
    var newArray = []
    for (misc of gameData.currentMisc) {
        newArray.push(gameData.itemData[misc.name])
    }
    gameData.currentMisc = newArray
}

function replaceSaveDict(dict, saveDict) {
    for (key in dict) {
        if (!(key in saveDict)) {
            saveDict[key] = dict[key]
        } else if (dict == gameData.requirements) {
            if (saveDict[key].type != tempData["requirements"][key].type) {
                saveDict[key] = tempData["requirements"][key]
            }
        }
    }

    for (key in saveDict) {
        if (!(key in dict)) {
            delete saveDict[key]
        }
    }
}

function saveGameData() {
    localStorage.setItem("gameDataSave", JSON.stringify(gameData))
}

function loadGameData() {
    var gameDataSave = JSON.parse(localStorage.getItem("gameDataSave"))

    if (gameDataSave !== null) {
        replaceSaveDict(gameData, gameDataSave)
        replaceSaveDict(gameData.requirements, gameDataSave.requirements)
        replaceSaveDict(gameData.taskData, gameDataSave.taskData)
        replaceSaveDict(gameData.itemData, gameDataSave.itemData)

        gameData = gameDataSave
    }

    assignMethods()
}

function updateUI() {
    updateTaskRows()
    updateItemRows()
    updateRequiredRows(gameData.taskData, jobCategories)
    updateRequiredRows(gameData.taskData, skillCategories)
    updateRequiredRows(gameData.itemData, itemCategories)
    updateHeaderRows(jobCategories)
    updateHeaderRows(skillCategories)
    updateQuickTaskDisplay("job")
    updateQuickTaskDisplay("skill")
    hideEntities()
    updateText()  
}

function update() {
    try {
        increaseDays()
        autoPromote()
        autoLearn()
        doCurrentTask(gameData.currentJob)
        doCurrentTask(gameData.currentSkill)
        applyExpenses()
    } catch (error) {
        console.error("Game tick failed", error)
    }

    try {
        updateUI()
    } catch (error) {
        console.error("UI update failed", error)
    }
}

function resetGameData() {
    localStorage.clear()
    location.reload()
}

function importGameData() {
    var importExportBox = document.getElementById("importExportBox")
    var data = JSON.parse(window.atob(importExportBox.value))
    gameData = data
    saveGameData()
    location.reload()
}

function exportGameData() {
    var importExportBox = document.getElementById("importExportBox")
    importExportBox.value = window.btoa(JSON.stringify(gameData))
}

//Init

createAllRows(jobCategories, "jobTable")
createAllRows(skillCategories, "skillTable")
createAllRows(itemCategories, "itemTable") 

createData(gameData.taskData, jobBaseData)
createData(gameData.taskData, skillBaseData)
createData(gameData.itemData, itemBaseData) 

gameData.currentJob = gameData.taskData["Beggar"]
gameData.currentSkill = gameData.taskData["Concentration"]
gameData.currentProperty = gameData.itemData["Homeless"]
gameData.currentMisc = []

gameData.requirements = {
    //Other
    "The Arcane Association": new TaskRequirement(getElementsByClass("The Arcane Association"), [{task: "Mana control", requirement: 1}]),
    "Dark magic": new EvilRequirement(getElementsByClass("Dark magic"), [{requirement: 1}]),
    "Evil work": new EvilRequirement(getElementsByClass("Evil work"), [{requirement: 5}]),
    "Multiverse": new RealityRequirement(getElementsByClass("Multiverse"), [{requirement: 1}]),
    "Shop": new CoinRequirement([document.getElementById("shopTabButton")], [{requirement: gameData.itemData["Tent"].getExpense() * 50}]),
    "Rebirth tab": new AgeRequirement([document.getElementById("rebirthTabButton")], [{requirement: 25}]),
    "Rebirth note 1": new AgeRequirement([document.getElementById("rebirthNote1")], [{requirement: 45}]),
    "Rebirth note 2": new AgeRequirement([document.getElementById("rebirthNote2")], [{requirement: 65}]),
    "Rebirth note 3": new AgeRequirement([document.getElementById("rebirthNote3")], [{requirement: 200}]),
    "Evil info": new EvilRequirement([document.getElementById("evilInfo")], [{requirement: 1}]),
    "Time warping info": new TaskRequirement([document.getElementById("timeWarping")], [{task: "Mage", requirement: 10}]),
    "Automation": new AgeRequirement([document.getElementById("automation")], [{requirement: 20}]),
    "Quick task display": new AgeRequirement([document.getElementById("quickTaskDisplay")], [{requirement: 20}]),

    //Common work
    "Beggar": new TaskRequirement([getTaskElement("Beggar")], []),
    "Farmer": new TaskRequirement([getTaskElement("Farmer")], [{task: "Beggar", requirement: 10}]),
    "Stable hand": new TaskRequirement([getTaskElement("Stable hand")], [{task: "Farmer", requirement: 8}]),
    "Fisherman": new TaskRequirement([getTaskElement("Fisherman")], [{task: "Stable hand", requirement: 8}]),
    "Woodcutter": new TaskRequirement([getTaskElement("Woodcutter")], [{task: "Strength", requirement: 8}, {task: "Fisherman", requirement: 8}]),
    "Miner": new TaskRequirement([getTaskElement("Miner")], [{task: "Strength", requirement: 15}, {task: "Woodcutter", requirement: 10}]),
    "Blacksmith": new TaskRequirement([getTaskElement("Blacksmith")], [{task: "Strength", requirement: 35}, {task: "Miner", requirement: 10}]),
    "Merchant": new TaskRequirement([getTaskElement("Merchant")], [{task: "Bargaining", requirement: 45}, {task: "Blacksmith", requirement: 10}]),

    //Military 
    "Squire": new TaskRequirement([getTaskElement("Squire")], [{task: "Strength", requirement: 5}]),
    "Footman": new TaskRequirement([getTaskElement("Footman")], [{task: "Strength", requirement: 20}, {task: "Squire", requirement: 10}]),
    "Veteran footman": new TaskRequirement([getTaskElement("Veteran footman")], [{task: "Battle tactics", requirement: 40}, {task: "Footman", requirement: 10}]),
    "Knight": new TaskRequirement([getTaskElement("Knight")], [{task: "Strength", requirement: 100}, {task: "Veteran footman", requirement: 10}]),
    "Veteran knight": new TaskRequirement([getTaskElement("Veteran knight")], [{task: "Battle tactics", requirement: 150}, {task: "Knight", requirement: 10}]),
    "Elite knight": new TaskRequirement([getTaskElement("Elite knight")], [{task: "Strength", requirement: 300}, {task: "Veteran knight", requirement: 10}]),
    "Holy knight": new TaskRequirement([getTaskElement("Holy knight")], [{task: "Mana control", requirement: 500}, {task: "Elite knight", requirement: 10}]),
    "Legendary knight": new TaskRequirement([getTaskElement("Legendary knight")], [{task: "Mana control", requirement: 1000}, {task: "Battle tactics", requirement: 1000}, {task: "Holy knight", requirement: 10}]),

    //The Arcane Association
    "Student": new TaskRequirement([getTaskElement("Student")], [{task: "Mana control", requirement: 1}]),
    "Apprentice mage": new TaskRequirement([getTaskElement("Apprentice mage")], [{task: "Mana control", requirement: 80}, {task: "Student", requirement: 10}]),
    "Mage": new TaskRequirement([getTaskElement("Mage")], [{task: "Mana control", requirement: 160}, {task: "Apprentice mage", requirement: 10}]),
    "Wizard": new TaskRequirement([getTaskElement("Wizard")], [{task: "Immortality", requirement: 40}, {task: "Mage", requirement: 10}]),
    "Master wizard": new TaskRequirement([getTaskElement("Master wizard")], [{task: "Time warping", requirement: 100}, {task: "Wizard", requirement: 10}]),
    "Chairman": new TaskRequirement([getTaskElement("Chairman")], [{task: "Time warping", requirement: 25}, {task: "Master wizard", requirement: 10}]),

    //Evil work
    "Ruin acolyte": new EvilRequirement([getTaskElement("Ruin acolyte")], [{requirement: 5}]),
    "Hex collector": new TaskRequirement([getTaskElement("Hex collector")], [{task: "Dark influence", requirement: 20}, {task: "Ruin acolyte", requirement: 10}]),
    "Soul broker": new TaskRequirement([getTaskElement("Soul broker")], [{task: "Evil control", requirement: 35}, {task: "Hex collector", requirement: 10}]),
    "Abyssal knight": new TaskRequirement([getTaskElement("Abyssal knight")], [{task: "Demon training", requirement: 45}, {task: "Soul broker", requirement: 10}]),
    "Infernal architect": new TaskRequirement([getTaskElement("Infernal architect")], [{task: "Blood meditation", requirement: 60}, {task: "Abyssal knight", requirement: 10}]),
    "Reality heretic": new TaskRequirement([getTaskElement("Reality heretic")], [{task: "Demon's wealth", requirement: 80}, {task: "Dark haste", requirement: 60}, {task: "Infernal architect", requirement: 10}]),

    //Fundamentals
    "Concentration": new TaskRequirement([getTaskElement("Concentration")], []),
    "Productivity": new TaskRequirement([getTaskElement("Productivity")], [{task: "Concentration", requirement: 5}]),
    "Patience": new TaskRequirement([getTaskElement("Patience")], [{task: "Concentration", requirement: 10}]),
    "Bargaining": new TaskRequirement([getTaskElement("Bargaining")], [{task: "Concentration", requirement: 20}]),
    "Frugality": new TaskRequirement([getTaskElement("Frugality")], [{task: "Bargaining", requirement: 10}]),
    "Diligence": new TaskRequirement([getTaskElement("Diligence")], [{task: "Productivity", requirement: 15}, {task: "Patience", requirement: 10}]),
    "Meditation": new TaskRequirement([getTaskElement("Meditation")], [{task: "Concentration", requirement: 25}, {task: "Productivity", requirement: 15}]),
    "Curiosity": new TaskRequirement([getTaskElement("Curiosity")], [{task: "Concentration", requirement: 35}, {task: "Patience", requirement: 15}]),

    //Combat
    "Strength": new TaskRequirement([getTaskElement("Strength")], []),
    "Endurance": new TaskRequirement([getTaskElement("Endurance")], [{task: "Strength", requirement: 10}]),
    "Weapon handling": new TaskRequirement([getTaskElement("Weapon handling")], [{task: "Strength", requirement: 15}]),
    "Battle tactics": new TaskRequirement([getTaskElement("Battle tactics")], [{task: "Concentration", requirement: 20}, {task: "Weapon handling", requirement: 10}]),
    "Muscle memory": new TaskRequirement([getTaskElement("Muscle memory")], [{task: "Concentration", requirement: 30}, {task: "Strength", requirement: 30}, {task: "Endurance", requirement: 20}]),

    //Magic
    "Mana control": new TaskRequirement([getTaskElement("Mana control")], [{task: "Concentration", requirement: 90}, {task: "Meditation", requirement: 70}, {task: "Curiosity", requirement: 25}]),
    "Arcane theory": new TaskRequirement([getTaskElement("Arcane theory")], [{task: "Mana control", requirement: 20}]),
    "Immortality": new TaskRequirement([getTaskElement("Immortality")], [{task: "Apprentice mage", requirement: 10}, {task: "Arcane theory", requirement: 25}]),
    "Time warping": new TaskRequirement([getTaskElement("Time warping")], [{task: "Mage", requirement: 10}]),
    "Super immortality": new TaskRequirement([getTaskElement("Super immortality")], [{task: "Immortality", requirement: 120}, {task: "Time warping", requirement: 75}, {task: "Chairman", requirement: 25}]),

    //Dark magic
    "Dark influence": new EvilRequirement([getTaskElement("Dark influence")], [{requirement: 1}]),
    "Evil control": new EvilRequirement([getTaskElement("Evil control")], [{requirement: 1}]),
    "Intimidation": new EvilRequirement([getTaskElement("Intimidation")], [{requirement: 1}]),
    "Demon training": new EvilRequirement([getTaskElement("Demon training")], [{requirement: 25}]),
    "Blood meditation": new EvilRequirement([getTaskElement("Blood meditation")], [{requirement: 75}]),
    "Demon's wealth": new EvilRequirement([getTaskElement("Demon's wealth")], [{requirement: 500}]),
    "Soul binding": new TaskRequirement([getTaskElement("Soul binding")], [{task: "Dark influence", requirement: 25}, {task: "Ruin acolyte", requirement: 5}]),
    "Dark haste": new TaskRequirement([getTaskElement("Dark haste")], [{task: "Demon training", requirement: 35}, {task: "Soul binding", requirement: 20}]),
    "Grave vitality": new TaskRequirement([getTaskElement("Grave vitality")], [{task: "Blood meditation", requirement: 35}, {task: "Soul binding", requirement: 30}]),
    "Sin economy": new TaskRequirement([getTaskElement("Sin economy")], [{task: "Demon's wealth", requirement: 25}, {task: "Soul broker", requirement: 5}]),
    "Reality fracture": new TaskRequirement([getTaskElement("Reality fracture")], [{task: "Reality heretic", requirement: 5}, {task: "Dark haste", requirement: 80}]),

    //Multiverse
    "Dimensional mapping": new RealityRequirement([getTaskElement("Dimensional mapping")], [{requirement: 1}]),
    "Parallel discipline": new TaskRequirement([getTaskElement("Parallel discipline")], [{task: "Dimensional mapping", requirement: 10}]),
    "Chrono geometry": new TaskRequirement([getTaskElement("Chrono geometry")], [{task: "Dimensional mapping", requirement: 25}]),
    "Echo longevity": new TaskRequirement([getTaskElement("Echo longevity")], [{task: "Dimensional mapping", requirement: 40}, {task: "Chrono geometry", requirement: 20}]),
    "Universe attunement": new TaskRequirement([getTaskElement("Universe attunement")], [{task: "Dimensional mapping", requirement: 60}, {task: "Parallel discipline", requirement: 30}]),

    //Properties
    "Homeless": new CoinRequirement([getItemElement("Homeless")], [{requirement: 0}]),
    "Tent": new CoinRequirement([getItemElement("Tent")], [{requirement: 0}]),
    "Wooden hut": new CoinRequirement([getItemElement("Wooden hut")], [{requirement: gameData.itemData["Wooden hut"].getExpense() * 100}]),
    "Cottage": new CoinRequirement([getItemElement("Cottage")], [{requirement: gameData.itemData["Cottage"].getExpense() * 100}]),
    "House": new CoinRequirement([getItemElement("House")], [{requirement: gameData.itemData["House"].getExpense() * 100}]),
    "Large house": new CoinRequirement([getItemElement("Large house")], [{requirement: gameData.itemData["Large house"].getExpense() * 100}]),
    "Small palace": new CoinRequirement([getItemElement("Small palace")], [{requirement: gameData.itemData["Small palace"].getExpense() * 100}]),
    "Grand palace": new CoinRequirement([getItemElement("Grand palace")], [{requirement: gameData.itemData["Grand palace"].getExpense() * 100}]),
    "Manor": new CoinRequirement([getItemElement("Manor")], [{requirement: gameData.itemData["Manor"].getExpense() * 80}]),
    "Guild hall": new CoinRequirement([getItemElement("Guild hall")], [{requirement: gameData.itemData["Guild hall"].getExpense() * 80}]),
    "Noble estate": new CoinRequirement([getItemElement("Noble estate")], [{requirement: gameData.itemData["Noble estate"].getExpense() * 80}]),
    "Royal keep": new CoinRequirement([getItemElement("Royal keep")], [{requirement: gameData.itemData["Royal keep"].getExpense() * 80}]),
    "Ancient citadel": new CoinRequirement([getItemElement("Ancient citadel")], [{requirement: gameData.itemData["Ancient citadel"].getExpense() * 80}]),
    "Sky crown palace": new CoinRequirement([getItemElement("Sky crown palace")], [{requirement: gameData.itemData["Sky crown palace"].getExpense() * 80}]),

    //Misc
    "Cheap meal": new CoinRequirement([getItemElement("Cheap meal")], [{requirement: 0}]),
    "Notebook": new CoinRequirement([getItemElement("Notebook")], [{requirement: 0}]),
    "Book": new CoinRequirement([getItemElement("Book")], [{requirement: gameData.itemData["Book"].getExpense() * 20}]),
    "Work gloves": new TaskRequirement([getItemElement("Work gloves")], [{task: "Farmer", requirement: 5}]),
    "Ledger": new TaskRequirement([getItemElement("Ledger")], [{task: "Frugality", requirement: 5}]),
    "Fishing net": new TaskRequirement([getItemElement("Fishing net")], [{task: "Fisherman", requirement: 3}]),
    "Dumbbells": new CoinRequirement([getItemElement("Dumbbells")], [{requirement: gameData.itemData["Dumbbells"].getExpense() * 60}]),
    "Training dummy": new TaskRequirement([getItemElement("Training dummy")], [{task: "Strength", requirement: 15}]),
    "Miner's lamp": new TaskRequirement([getItemElement("Miner's lamp")], [{task: "Miner", requirement: 3}]),
    "Meditation mat": new TaskRequirement([getItemElement("Meditation mat")], [{task: "Meditation", requirement: 15}]),
    "Personal squire": new CoinRequirement([getItemElement("Personal squire")], [{requirement: gameData.itemData["Personal squire"].getExpense() * 100}]),
    "Steel longsword": new CoinRequirement([getItemElement("Steel longsword")], [{requirement: gameData.itemData["Steel longsword"].getExpense() * 100}]),
    "Butler": new CoinRequirement([getItemElement("Butler")], [{requirement: gameData.itemData["Butler"].getExpense() * 100}]),
    "Sapphire charm": new CoinRequirement([getItemElement("Sapphire charm")], [{requirement: gameData.itemData["Sapphire charm"].getExpense() * 100}]),
    "Arcane focus": new TaskRequirement([getItemElement("Arcane focus")], [{task: "Mana control", requirement: 20}]),
    "Royal ledger": new TaskRequirement([getItemElement("Royal ledger")], [{task: "Merchant", requirement: 25}, {task: "Frugality", requirement: 30}]),
    "Study desk": new CoinRequirement([getItemElement("Study desk")], [{requirement: gameData.itemData["Study desk"].getExpense() * 100}]),
    "Library": new CoinRequirement([getItemElement("Library")], [{requirement: gameData.itemData["Library"].getExpense() * 100}]), 
}

tempData["requirements"] = {}
for (key in gameData.requirements) {
    var requirement = gameData.requirements[key]
    tempData["requirements"][key] = requirement
}

loadGameData()

setCustomEffects()
addMultipliers()

setTab(jobTabButton, "jobs")

update()
setInterval(update, 1000 / updateSpeed)
setInterval(saveGameData, 3000)
setInterval(setSkillWithLowestMaxXp, 1000)
