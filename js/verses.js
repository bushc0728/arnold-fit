/* 100+ curated KJV (public domain) verses with short reflections — offline */
'use strict';
const VERSES = [
{
"id": 1,
"ref": "1 Corinthians 9:24-25",
"theme": "Discipline",
"text": "Know ye not that they which run in a race run all, but one receiveth the prize? So run, that ye may obtain. And every man that striveth for the mastery is temperate in all things. Now they do it to obtain a corruptible crown; but we an incorruptible.",
"note": "Paul uses athletes as the model: they train with purpose and deny themselves for a prize. Train today like the prize is real — because it is."
},
{
"id": 2,
"ref": "1 Corinthians 9:26-27",
"theme": "Discipline",
"text": "I therefore so run, not as uncertainly; so fight I, not as one that beateth the air: But I keep under my body, and bring it into subjection: lest that by any means, when I have preached to others, I myself should be a castaway.",
"note": "Discipline isn't punishment; it's direction. Bring your body under a plan so your choices match your convictions."
},
{
"id": 3,
"ref": "1 Corinthians 6:19-20",
"theme": "Temple",
"text": "What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own? For ye are bought with a price: therefore glorify God in your body, and in your spirit, which are God’s.",
"note": "Your body is a gift entrusted to you, not a project for vanity. Fueling, training, and resting it well is a form of worship."
},
{
"id": 4,
"ref": "1 Corinthians 10:31",
"theme": "Temple",
"text": "Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God.",
"note": "Even eating and drinking can be done for God's glory. Today's plate is part of your devotion, not separate from it."
},
{
"id": 5,
"ref": "1 Timothy 4:8",
"theme": "Discipline",
"text": "For bodily exercise profiteth little: but godliness is profitable unto all things, having promise of the life that now is, and of that which is to come.",
"note": "Physical training has real value — and godliness has more. Pursue both, keeping the order right."
},
{
"id": 6,
"ref": "1 Timothy 4:7",
"theme": "Discipline",
"text": "But refuse profane and old wives’ fables, and exercise thyself rather unto godliness.",
"note": "Godliness, like strength, is trained. Put in reps of prayer and Scripture the way you put in reps under the bar."
},
{
"id": 7,
"ref": "Hebrews 12:11",
"theme": "Discipline",
"text": "Now no chastening for the present seemeth to be joyous, but grievous: nevertheless afterward it yieldeth the peaceable fruit of righteousness unto them which are exercised thereby.",
"note": "Discipline hurts in the moment and pays later. The sore legs and the skipped dessert are seeds of a harvest."
},
{
"id": 8,
"ref": "Hebrews 12:1",
"theme": "Perseverance",
"text": "Wherefore seeing we also are compassed about with so great a cloud of witnesses, let us lay aside every weight, and the sin which doth so easily beset us, and let us run with patience the race that is set before us,",
"note": "Drop what slows you down and run your race with endurance. Focus on your lane, not everyone else's."
},
{
"id": 9,
"ref": "Hebrews 12:2",
"theme": "Perseverance",
"text": "Looking unto Jesus the author and finisher of our faith; who for the joy that was set before him endured the cross, despising the shame, and is set down at the right hand of the throne of God.",
"note": "Jesus endured the cross for the joy set before Him. Keep your eyes on the finish, not the discomfort."
},
{
"id": 10,
"ref": "Hebrews 12:12-13",
"theme": "Perseverance",
"text": "Wherefore lift up the hands which hang down, and the feeble knees; And make straight paths for your feet, lest that which is lame be turned out of the way; but let it rather be healed.",
"note": "Strengthen the weak knees and make straight paths — a fitting word for an athlete rebuilding after injury."
},
{
"id": 11,
"ref": "Hebrews 10:36",
"theme": "Perseverance",
"text": "For ye have need of patience, that, after ye have done the will of God, ye might receive the promise.",
"note": "Patience is the bridge between doing the work and receiving the promise. Keep showing up."
},
{
"id": 12,
"ref": "Philippians 4:13",
"theme": "Strength",
"text": "I can do all things through Christ which strengtheneth me.",
"note": "This isn't a promise of a bigger bench; it's strength to be faithful in every circumstance — including the hard set."
},
{
"id": 13,
"ref": "Philippians 3:13-14",
"theme": "Perseverance",
"text": "Brethren, I count not myself to have apprehended: but this one thing I do, forgetting those things which are behind, and reaching forth unto those things which are before, I press toward the mark for the prize of the high calling of God in Christ Jesus.",
"note": "Forget yesterday's misses and press toward the mark. Each day is a new rep."
},
{
"id": 14,
"ref": "Philippians 3:12",
"theme": "Perseverance",
"text": "Not as though I had already attained, either were already perfect: but I follow after, if that I may apprehend that for which also I am apprehended of Christ Jesus.",
"note": "Paul hadn't arrived either. Progress, not perfection, is the standard."
},
{
"id": 15,
"ref": "Philippians 1:6",
"theme": "Perseverance",
"text": "Being confident of this very thing, that he which hath begun a good work in you will perform it until the day of Jesus Christ:",
"note": "God finishes what He starts. You are a work in progress, and He's not done."
},
{
"id": 16,
"ref": "Philippians 4:6-7",
"theme": "Peace",
"text": "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.",
"note": "Anxiety about results crowds out peace. Pray, give thanks, and let God guard your heart."
},
{
"id": 17,
"ref": "Philippians 4:8",
"theme": "Mind",
"text": "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.",
"note": "What you dwell on shapes who you become. Fill your mind with what is true and excellent."
},
{
"id": 18,
"ref": "Isaiah 40:31",
"theme": "Strength",
"text": "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.",
"note": "Waiting on the Lord renews strength. Rest and dependence are part of the training plan."
},
{
"id": 19,
"ref": "Isaiah 40:29",
"theme": "Strength",
"text": "He giveth power to the faint; and to them that have no might he increaseth strength.",
"note": "God gives power to the faint. When you have nothing left, you're right where His strength shows up."
},
{
"id": 20,
"ref": "Isaiah 41:10",
"theme": "Strength",
"text": "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
"note": "Fear not — He will strengthen and uphold you. You never train alone."
},
{
"id": 21,
"ref": "Isaiah 26:3",
"theme": "Peace",
"text": "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.",
"note": "Perfect peace comes from a mind stayed on God. Fix your focus before you fix your form."
},
{
"id": 22,
"ref": "Joshua 1:9",
"theme": "Courage",
"text": "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
"note": "Be strong and courageous — it's a command, not a mood. Courage is choosing the right action while afraid."
},
{
"id": 23,
"ref": "Joshua 1:8",
"theme": "Discipline",
"text": "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.",
"note": "Meditate on the Word day and night. Consistency in small daily inputs produces success."
},
{
"id": 24,
"ref": "Deuteronomy 31:6",
"theme": "Courage",
"text": "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.",
"note": "He will not fail you nor forsake you. Walk into hard things knowing who goes with you."
},
{
"id": 25,
"ref": "Psalm 18:32",
"theme": "Strength",
"text": "It is God that girdeth me with strength, and maketh my way perfect.",
"note": "It is God who girds you with strength and makes your way perfect. Thank Him for the strength you have today."
},
{
"id": 26,
"ref": "Psalm 18:34",
"theme": "Strength",
"text": "He teacheth my hands to war, so that a bow of steel is broken by mine arms.",
"note": "He trains hands for battle. Your training is a place God can shape you."
},
{
"id": 27,
"ref": "Psalm 18:39",
"theme": "Strength",
"text": "For thou hast girded me with strength unto the battle: thou hast subdued under me those that rose up against me.",
"note": "Strength for the battle comes from Him. Prepare well, then trust."
},
{
"id": 28,
"ref": "Psalm 28:7",
"theme": "Strength",
"text": "The LORD is my strength and my shield; my heart trusted in him, and I am helped: therefore my heart greatly rejoiceth; and with my song will I praise him.",
"note": "The Lord is your strength and shield. A trusting heart is a strong heart."
},
{
"id": 29,
"ref": "Psalm 46:1",
"theme": "Strength",
"text": "God is our refuge and strength, a very present help in trouble.",
"note": "A very present help in trouble — present right now, not someday."
},
{
"id": 30,
"ref": "Psalm 46:10",
"theme": "Peace",
"text": "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.",
"note": "Be still. Recovery days and quiet moments are holy too."
},
{
"id": 31,
"ref": "Psalm 73:26",
"theme": "Strength",
"text": "My flesh and my heart faileth: but God is the strength of my heart, and my portion for ever.",
"note": "When flesh and heart fail, God is the strength of your heart. Your knees may be weak; He is not."
},
{
"id": 32,
"ref": "Psalm 118:24",
"theme": "Gratitude",
"text": "This is the day which the LORD hath made; we will rejoice and be glad in it.",
"note": "This is the day the Lord has made. Win today; that's the only day you're given."
},
{
"id": 33,
"ref": "Psalm 119:105",
"theme": "Wisdom",
"text": "Thy word is a lamp unto my feet, and a light unto my path.",
"note": "The Word lights the next step, not the whole road. Take the next faithful step."
},
{
"id": 34,
"ref": "Psalm 119:9",
"theme": "Purity",
"text": "Wherewithal shall a young man cleanse his way? by taking heed thereto according to thy word.",
"note": "A young man keeps his way pure by heeding God's Word. Guard your path daily."
},
{
"id": 35,
"ref": "Psalm 139:14",
"theme": "Temple",
"text": "I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.",
"note": "You are fearfully and wonderfully made. Train your body out of gratitude, not shame."
},
{
"id": 36,
"ref": "Psalm 37:5",
"theme": "Trust",
"text": "Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.",
"note": "Commit your way to the Lord. Plan your training, then hold the plan with open hands."
},
{
"id": 37,
"ref": "Psalm 37:23-24",
"theme": "Perseverance",
"text": "The steps of a good man are ordered by the LORD: and he delighteth in his way. Though he fall, he shall not be utterly cast down: for the LORD upholdeth him with his hand.",
"note": "Though a good man fall, he shall not be utterly cast down. A setback isn't the end of the story."
},
{
"id": 38,
"ref": "Psalm 27:1",
"theme": "Courage",
"text": "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?",
"note": "The Lord is your light and strength — of whom shall you be afraid?"
},
{
"id": 39,
"ref": "Psalm 27:14",
"theme": "Patience",
"text": "Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.",
"note": "Wait on the Lord and be of good courage. Results take time; faithfulness takes today."
},
{
"id": 40,
"ref": "Psalm 23:1-3",
"theme": "Rest",
"text": "The LORD is my shepherd; I shall not want. He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul: he leadeth me in the paths of righteousness for his name’s sake.",
"note": "He makes you lie down in green pastures. Sleep and rest are gifts, not weakness."
},
{
"id": 41,
"ref": "Psalm 127:2",
"theme": "Rest",
"text": "It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so he giveth his beloved sleep.",
"note": "God gives His beloved sleep. Eight hours is obedience, not laziness."
},
{
"id": 42,
"ref": "Psalm 90:12",
"theme": "Wisdom",
"text": "So teach us to number our days, that we may apply our hearts unto wisdom.",
"note": "Number your days and apply your heart to wisdom. Each day of this plan counts."
},
{
"id": 43,
"ref": "Psalm 16:8",
"theme": "Focus",
"text": "I have set the LORD always before me: because he is at my right hand, I shall not be moved.",
"note": "Set the Lord always before you, and you will not be moved."
},
{
"id": 44,
"ref": "Psalm 31:24",
"theme": "Courage",
"text": "Be of good courage, and he shall strengthen your heart, all ye that hope in the LORD.",
"note": "Be of good courage, and He shall strengthen your heart."
},
{
"id": 45,
"ref": "Psalm 62:1-2",
"theme": "Trust",
"text": "Truly my soul waiteth upon God: from him cometh my salvation. He only is my rock and my salvation; he is my defence; I shall not be greatly moved.",
"note": "He alone is your rock. Build on what can't be shaken."
},
{
"id": 46,
"ref": "Psalm 121:1-2",
"theme": "Trust",
"text": "I will lift up mine eyes unto the hills, from whence cometh my help. My help cometh from the LORD, which made heaven and earth.",
"note": "Your help comes from the Lord who made heaven and earth."
},
{
"id": 47,
"ref": "Psalm 19:14",
"theme": "Mind",
"text": "Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD, my strength, and my redeemer.",
"note": "Let your words and thoughts be acceptable to God — including the way you talk to yourself."
},
{
"id": 48,
"ref": "Psalm 51:10",
"theme": "Purity",
"text": "Create in me a clean heart, O God; and renew a right spirit within me.",
"note": "Ask for a clean heart and a right spirit. Inner renewal fuels outer discipline."
},
{
"id": 49,
"ref": "Proverbs 3:5-6",
"theme": "Trust",
"text": "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
"note": "Trust in the Lord, not your own understanding. Ask Him to direct your paths."
},
{
"id": 50,
"ref": "Proverbs 3:7-8",
"theme": "Temple",
"text": "Be not wise in thine own eyes: fear the LORD, and depart from evil. It shall be health to thy navel, and marrow to thy bones.",
"note": "Fearing the Lord brings health to your body. Spiritual health and physical health are linked."
},
{
"id": 51,
"ref": "Proverbs 4:23",
"theme": "Mind",
"text": "Keep thy heart with all diligence; for out of it are the issues of life.",
"note": "Guard your heart with diligence — everything flows from it."
},
{
"id": 52,
"ref": "Proverbs 4:25-26",
"theme": "Focus",
"text": "Let thine eyes look right on, and let thine eyelids look straight before thee. Ponder the path of thy feet, and let all thy ways be established.",
"note": "Look straight ahead and ponder the path of your feet. Focus wins."
},
{
"id": 53,
"ref": "Proverbs 6:6-8",
"theme": "Diligence",
"text": "Go to the ant, thou sluggard; consider her ways, and be wise: Which having no guide, overseer, or ruler, Provideth her meat in the summer, and gathereth her food in the harvest.",
"note": "The ant prepares without a supervisor. Self-discipline is doing it when no one is watching."
},
{
"id": 54,
"ref": "Proverbs 10:4",
"theme": "Diligence",
"text": "He becometh poor that dealeth with a slack hand: but the hand of the diligent maketh rich.",
"note": "The hand of the diligent makes rich. Consistent effort compounds."
},
{
"id": 55,
"ref": "Proverbs 12:1",
"theme": "Discipline",
"text": "Whoso loveth instruction loveth knowledge: but he that hateth reproof is brutish.",
"note": "Whoever loves instruction loves knowledge. Welcome correction — from coaches, data, and God."
},
{
"id": 56,
"ref": "Proverbs 13:4",
"theme": "Diligence",
"text": "The soul of the sluggard desireth, and hath nothing: but the soul of the diligent shall be made fat.",
"note": "The soul of the diligent shall be made fat (abundant). Wanting isn't enough; doing is."
},
{
"id": 57,
"ref": "Proverbs 14:23",
"theme": "Diligence",
"text": "In all labour there is profit: but the talk of the lips tendeth only to penury.",
"note": "In all labour there is profit; mere talk leads to poverty. Less planning, more doing."
},
{
"id": 58,
"ref": "Proverbs 16:3",
"theme": "Trust",
"text": "Commit thy works unto the LORD, and thy thoughts shall be established.",
"note": "Commit your works to the Lord and your thoughts will be established."
},
{
"id": 59,
"ref": "Proverbs 16:9",
"theme": "Trust",
"text": "A man’s heart deviseth his way: but the LORD directeth his steps.",
"note": "You plan your way; the Lord directs your steps. Hold your program loosely and your God tightly."
},
{
"id": 60,
"ref": "Proverbs 16:32",
"theme": "Self-control",
"text": "He that is slow to anger is better than the mighty; and he that ruleth his spirit than he that taketh a city.",
"note": "Ruling your own spirit is greater than taking a city. Self-mastery is real strength."
},
{
"id": 61,
"ref": "Proverbs 21:5",
"theme": "Diligence",
"text": "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.",
"note": "The thoughts of the diligent lead to plenty; haste leads to want. Steady beats rushed."
},
{
"id": 62,
"ref": "Proverbs 24:16",
"theme": "Perseverance",
"text": "For a just man falleth seven times, and riseth up again: but the wicked shall fall into mischief.",
"note": "A just man falls seven times and rises up again. Getting back up is the skill."
},
{
"id": 63,
"ref": "Proverbs 25:28",
"theme": "Self-control",
"text": "He that hath no rule over his own spirit is like a city that is broken down, and without walls.",
"note": "A man without self-control is like a city with broken walls. Your habits are your walls."
},
{
"id": 64,
"ref": "Proverbs 27:17",
"theme": "Community",
"text": "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.",
"note": "Iron sharpens iron. Train and grow with people who push you."
},
{
"id": 65,
"ref": "Proverbs 23:20-21",
"theme": "Temple",
"text": "Be not among winebibbers; among riotous eaters of flesh: For the drunkard and the glutton shall come to poverty: and drowsiness shall clothe a man with rags.",
"note": "Be not among winebibbers or gluttonous eaters. Moderation protects your goals and your clarity."
},
{
"id": 66,
"ref": "Proverbs 20:1",
"theme": "Self-control",
"text": "Wine is a mocker, strong drink is raging: and whosoever is deceived thereby is not wise.",
"note": "Wine is a mocker. One night a week, at most, keeps the mocker in its place."
},
{
"id": 67,
"ref": "Proverbs 31:17",
"theme": "Strength",
"text": "She girdeth her loins with strength, and strengtheneth her arms.",
"note": "She girds her loins with strength and strengthens her arms. Strength is honorable work."
},
{
"id": 68,
"ref": "Ecclesiastes 9:10",
"theme": "Diligence",
"text": "Whatsoever thy hand findeth to do, do it with thy might; for there is no work, nor device, nor knowledge, nor wisdom, in the grave, whither thou goest.",
"note": "Whatever your hand finds to do, do it with all your might. Give the top set everything."
},
{
"id": 69,
"ref": "Ecclesiastes 3:1",
"theme": "Rest",
"text": "To every thing there is a season, and a time to every purpose under the heaven:",
"note": "There is a season for everything — even deload weeks."
},
{
"id": 70,
"ref": "Ecclesiastes 4:9-10",
"theme": "Community",
"text": "Two are better than one; because they have a good reward for their labour. For if they fall, the one will lift up his fellow: but woe to him that is alone when he falleth; for he hath not another to help him up.",
"note": "Two are better than one; if one falls, the other lifts him up. Have a spotter in life."
},
{
"id": 71,
"ref": "Galatians 6:9",
"theme": "Perseverance",
"text": "And let us not be weary in well doing: for in due season we shall reap, if we faint not.",
"note": "Do not grow weary in doing good; in due season you will reap if you don't quit."
},
{
"id": 72,
"ref": "Galatians 5:22-23",
"theme": "Self-control",
"text": "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, Meekness, temperance: against such there is no law.",
"note": "Self-control is a fruit of the Spirit — grown, not forced. Stay connected to the Vine."
},
{
"id": 73,
"ref": "Galatians 2:20",
"theme": "Identity",
"text": "I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me.",
"note": "You live by faith in the Son of God who loved you. Your identity isn't your scale weight."
},
{
"id": 74,
"ref": "Colossians 3:23",
"theme": "Diligence",
"text": "And whatsoever ye do, do it heartily, as to the Lord, and not unto men;",
"note": "Work heartily, as to the Lord. Your effort is an offering."
},
{
"id": 75,
"ref": "Colossians 3:17",
"theme": "Purpose",
"text": "And whatsoever ye do in word or deed, do all in the name of the Lord Jesus, giving thanks to God and the Father by him.",
"note": "Do everything in the name of the Lord Jesus, giving thanks. Even a 30-minute easy run."
},
{
"id": 76,
"ref": "Colossians 3:2",
"theme": "Focus",
"text": "Set your affection on things above, not on things on the earth.",
"note": "Set your affection on things above. Eternal priorities put daily goals in perspective."
},
{
"id": 77,
"ref": "Romans 12:1",
"theme": "Temple",
"text": "I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.",
"note": "Present your body as a living sacrifice. Daily choices about your body are spiritual acts."
},
{
"id": 78,
"ref": "Romans 12:2",
"theme": "Mind",
"text": "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.",
"note": "Be transformed by renewing your mind. Change starts with what you think about."
},
{
"id": 79,
"ref": "Romans 5:3-4",
"theme": "Perseverance",
"text": "And not only so, but we glory in tribulations also: knowing that tribulation worketh patience; And patience, experience; and experience, hope:",
"note": "Tribulation works patience, patience experience, experience hope. Hard seasons build you."
},
{
"id": 80,
"ref": "Romans 8:28",
"theme": "Trust",
"text": "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
"note": "All things work together for good to those who love God — even injuries and setbacks."
},
{
"id": 81,
"ref": "Romans 8:37",
"theme": "Strength",
"text": "Nay, in all these things we are more than conquerors through him that loved us.",
"note": "More than conquerors through Him that loved us. Your security is already won."
},
{
"id": 82,
"ref": "Romans 15:13",
"theme": "Hope",
"text": "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.",
"note": "The God of hope fills you with joy and peace. Train from hope, not fear."
},
{
"id": 83,
"ref": "2 Timothy 1:7",
"theme": "Courage",
"text": "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
"note": "God gave you a spirit of power, love, and a sound mind (self-discipline), not fear."
},
{
"id": 84,
"ref": "2 Timothy 2:3",
"theme": "Perseverance",
"text": "Thou therefore endure hardness, as a good soldier of Jesus Christ.",
"note": "Endure hardness as a good soldier. Comfort is not the goal; faithfulness is."
},
{
"id": 85,
"ref": "2 Timothy 2:5",
"theme": "Discipline",
"text": "And if a man also strive for masteries, yet is he not crowned, except he strive lawfully.",
"note": "An athlete isn't crowned unless he competes by the rules. Do it the right way."
},
{
"id": 86,
"ref": "2 Timothy 4:7",
"theme": "Perseverance",
"text": "I have fought a good fight, I have finished my course, I have kept the faith:",
"note": "I have fought a good fight, I have finished my course. Aim to finish well."
},
{
"id": 87,
"ref": "2 Corinthians 12:9",
"theme": "Strength",
"text": "And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness. Most gladly therefore will I rather glory in my infirmities, that the power of Christ may rest upon me.",
"note": "His strength is made perfect in weakness. Your limitations are where grace shines."
},
{
"id": 88,
"ref": "2 Corinthians 4:16",
"theme": "Perseverance",
"text": "For which cause we faint not; but though our outward man perish, yet the inward man is renewed day by day.",
"note": "Though the outward man perish, the inward man is renewed day by day."
},
{
"id": 89,
"ref": "2 Corinthians 4:17-18",
"theme": "Perspective",
"text": "For our light affliction, which is but for a moment, worketh for us a far more exceeding and eternal weight of glory; While we look not at the things which are seen, but at the things which are not seen: for the things which are seen are temporal; but the things which are not seen are eternal.",
"note": "Light affliction, eternal weight of glory. Look at what is unseen."
},
{
"id": 90,
"ref": "2 Corinthians 5:17",
"theme": "Identity",
"text": "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.",
"note": "In Christ you are a new creature. Old patterns don't define you."
},
{
"id": 91,
"ref": "2 Corinthians 9:6",
"theme": "Diligence",
"text": "But this I say, He which soweth sparingly shall reap also sparingly; and he which soweth bountifully shall reap also bountifully.",
"note": "Sow sparingly, reap sparingly; sow bountifully, reap bountifully."
},
{
"id": 92,
"ref": "1 Corinthians 15:58",
"theme": "Perseverance",
"text": "Therefore, my beloved brethren, be ye stedfast, unmovable, always abounding in the work of the Lord, forasmuch as ye know that your labour is not in vain in the Lord.",
"note": "Be steadfast, unmovable, always abounding — your labor is not in vain."
},
{
"id": 93,
"ref": "1 Corinthians 16:13",
"theme": "Courage",
"text": "Watch ye, stand fast in the faith, quit you like men, be strong.",
"note": "Watch, stand fast in the faith, quit you like men, be strong."
},
{
"id": 94,
"ref": "1 Corinthians 10:13",
"theme": "Self-control",
"text": "There hath no temptation taken you but such as is common to man: but God is faithful, who will not suffer you to be tempted above that ye are able; but will with the temptation also make a way to escape, that ye may be able to bear it.",
"note": "No temptation is beyond what you can bear; God provides a way of escape. Look for the exit."
},
{
"id": 95,
"ref": "James 1:2-4",
"theme": "Perseverance",
"text": "My brethren, count it all joy when ye fall into divers temptations; Knowing this, that the trying of your faith worketh patience. But let patience have her perfect work, that ye may be perfect and entire, wanting nothing.",
"note": "Count it joy when trials come; patience makes you complete. The struggle is the training."
},
{
"id": 96,
"ref": "James 1:12",
"theme": "Perseverance",
"text": "Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown of life, which the Lord hath promised to them that love him.",
"note": "Blessed is the man who endures temptation; he receives the crown of life."
},
{
"id": 97,
"ref": "James 1:5",
"theme": "Wisdom",
"text": "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
"note": "If you lack wisdom, ask God — He gives generously. Ask for wisdom about your body and plan."
},
{
"id": 98,
"ref": "James 1:22",
"theme": "Diligence",
"text": "But be ye doers of the word, and not hearers only, deceiving your own selves.",
"note": "Be doers of the word, not hearers only. Knowing the plan isn't the same as doing it."
},
{
"id": 99,
"ref": "James 4:7",
"theme": "Self-control",
"text": "Submit yourselves therefore to God. Resist the devil, and he will flee from you.",
"note": "Submit to God, resist the devil, and he will flee. Resistance training for the soul."
},
{
"id": 100,
"ref": "1 Peter 5:6-7",
"theme": "Trust",
"text": "Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time: Casting all your care upon him; for he careth for you.",
"note": "Humble yourself and cast your cares on Him, for He cares for you."
},
{
"id": 101,
"ref": "1 Peter 5:8-9",
"theme": "Focus",
"text": "Be sober, be vigilant; because your adversary the devil, as a roaring lion, walketh about, seeking whom he may devour: Whom resist stedfast in the faith, knowing that the same afflictions are accomplished in your brethren that are in the world.",
"note": "Be sober and vigilant; resist steadfast in the faith. Alertness is a daily discipline."
},
{
"id": 102,
"ref": "1 Peter 1:13",
"theme": "Mind",
"text": "Wherefore gird up the loins of your mind, be sober, and hope to the end for the grace that is to be brought unto you at the revelation of Jesus Christ;",
"note": "Gird up the loins of your mind and be sober. Prepare your mind like you warm up your body."
},
{
"id": 103,
"ref": "2 Peter 1:5-6",
"theme": "Self-control",
"text": "And beside this, giving all diligence, add to your faith virtue; and to virtue knowledge; And to knowledge temperance; and to temperance patience; and to patience godliness;",
"note": "Add to faith virtue, knowledge, temperance (self-control), patience. Growth is layered like training blocks."
},
{
"id": 104,
"ref": "Matthew 6:33",
"theme": "Priorities",
"text": "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",
"note": "Seek first the kingdom of God. Get the order right and the rest falls into place."
},
{
"id": 105,
"ref": "Matthew 6:34",
"theme": "Peace",
"text": "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.",
"note": "Don't worry about tomorrow. Do today's session; tomorrow has its own."
},
{
"id": 106,
"ref": "Matthew 11:28-30",
"theme": "Rest",
"text": "Come unto me, all ye that labour and are heavy laden, and I will give you rest. Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls. For my yoke is easy, and my burden is light.",
"note": "Come to Me and I will give you rest. Recovery for the soul is found in Him."
},
{
"id": 107,
"ref": "Matthew 7:24-25",
"theme": "Foundation",
"text": "Therefore whosoever heareth these sayings of mine, and doeth them, I will liken him unto a wise man, which built his house upon a rock: And the rain descended, and the floods came, and the winds blew, and beat upon that house; and it fell not: for it was founded upon a rock.",
"note": "Build on the rock. Fundamentals — sleep, protein, consistency — are your foundation too."
},
{
"id": 108,
"ref": "Matthew 26:41",
"theme": "Self-control",
"text": "Watch and pray, that ye enter not into temptation: the spirit indeed is willing, but the flesh is weak.",
"note": "The spirit is willing but the flesh is weak. Plan ahead for weak moments."
},
{
"id": 109,
"ref": "Matthew 5:16",
"theme": "Purpose",
"text": "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.",
"note": "Let your light shine. Your discipline can point others to God."
},
{
"id": 110,
"ref": "Mark 1:35",
"theme": "Discipline",
"text": "And in the morning, rising up a great while before day, he went out, and departed into a solitary place, and there prayed.",
"note": "Jesus rose early to pray in a solitary place. Protect time with God before the day gets loud."
},
{
"id": 111,
"ref": "Mark 9:23",
"theme": "Faith",
"text": "Jesus said unto him, If thou canst believe, all things are possible to him that believeth.",
"note": "All things are possible to him that believeth."
},
{
"id": 112,
"ref": "Luke 9:23",
"theme": "Discipline",
"text": "And he said to them all, If any man will come after me, let him deny himself, and take up his cross daily, and follow me.",
"note": "Deny yourself, take up your cross daily. Discipline is a daily decision."
},
{
"id": 113,
"ref": "Luke 16:10",
"theme": "Diligence",
"text": "He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.",
"note": "Faithful in little, faithful in much. Small habits matter."
},
{
"id": 114,
"ref": "John 15:5",
"theme": "Dependence",
"text": "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing.",
"note": "Without Him you can do nothing. Abide first, then produce."
},
{
"id": 115,
"ref": "John 16:33",
"theme": "Courage",
"text": "These things I have spoken unto you, that in me ye might have peace. In the world ye shall have tribulation: but be of good cheer; I have overcome the world.",
"note": "In the world you'll have tribulation — but be of good cheer, He has overcome."
},
{
"id": 116,
"ref": "Ephesians 6:10",
"theme": "Strength",
"text": "Finally, my brethren, be strong in the Lord, and in the power of his might.",
"note": "Be strong in the Lord and in the power of His might."
},
{
"id": 117,
"ref": "Ephesians 3:20",
"theme": "Hope",
"text": "Now unto him that is able to do exceeding abundantly above all that we ask or think, according to the power that worketh in us,",
"note": "He is able to do exceeding abundantly above all you ask or think."
},
{
"id": 118,
"ref": "Ephesians 2:10",
"theme": "Purpose",
"text": "For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.",
"note": "You are His workmanship, created for good works. Your body and effort have purpose."
},
{
"id": 119,
"ref": "Nehemiah 8:10",
"theme": "Joy",
"text": "Then he said unto them, Go your way, eat the fat, and drink the sweet, and send portions unto them for whom nothing is prepared: for this day is holy unto our Lord: neither be ye sorry; for the joy of the LORD is your strength.",
"note": "The joy of the Lord is your strength. Joy fuels endurance."
},
{
"id": 120,
"ref": "Micah 6:8",
"theme": "Character",
"text": "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?",
"note": "Do justly, love mercy, walk humbly. Character is the real program."
},
{
"id": 121,
"ref": "Zechariah 4:10",
"theme": "Patience",
"text": "For who hath despised the day of small things? for they shall rejoice, and shall see the plummet in the hand of Zerubbabel with those seven; they are the eyes of the LORD, which run to and fro through the whole earth.",
"note": "Do not despise the day of small things. Small beginnings — one length of freestyle — matter."
},
{
"id": 122,
"ref": "Lamentations 3:22-23",
"theme": "Hope",
"text": "It is of the LORD’S mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
"note": "His mercies are new every morning. Yesterday's miss doesn't carry over."
},
{
"id": 123,
"ref": "Habakkuk 3:19",
"theme": "Strength",
"text": "The LORD God is my strength, and he will make my feet like hinds’ feet, and he will make me to walk upon mine high places. To the chief singer on my stringed instruments.",
"note": "The Lord is my strength; He makes my feet like hinds' feet on high places — sure-footed on hard terrain."
},
{
"id": 124,
"ref": "Exodus 15:2",
"theme": "Strength",
"text": "The LORD is my strength and song, and he is become my salvation: he is my God, and I will prepare him an habitation; my father’s God, and I will exalt him.",
"note": "The Lord is my strength and song. Let gratitude be your soundtrack."
},
{
"id": 125,
"ref": "Daniel 1:8",
"theme": "Self-control",
"text": "But Daniel purposed in his heart that he would not defile himself with the portion of the king’s meat, nor with the wine which he drank: therefore he requested of the prince of the eunuchs that he might not defile himself.",
"note": "Daniel purposed in his heart not to defile himself with the king's food. Decide before the moment comes."
},
{
"id": 126,
"ref": "1 John 4:4",
"theme": "Courage",
"text": "Ye are of God, little children, and have overcome them: because greater is he that is in you, than he that is in the world.",
"note": "Greater is He that is in you than he that is in the world."
},
{
"id": 127,
"ref": "1 Thessalonians 5:16-18",
"theme": "Gratitude",
"text": "Rejoice evermore. Pray without ceasing. In every thing give thanks: for this is the will of God in Christ Jesus concerning you.",
"note": "Rejoice always, pray without ceasing, give thanks in everything."
},
{
"id": 128,
"ref": "Titus 2:11-12",
"theme": "Self-control",
"text": "For the grace of God that bringeth salvation hath appeared to all men, Teaching us that, denying ungodliness and worldly lusts, we should live soberly, righteously, and godly, in this present world;",
"note": "Grace teaches us to live soberly and righteously. Grace is a coach, not an excuse."
},
{
"id": 129,
"ref": "Revelation 3:8",
"theme": "Perseverance",
"text": "I know thy works: behold, I have set before thee an open door, and no man can shut it: for thou hast a little strength, and hast kept my word, and hast not denied my name.",
"note": "You have a little strength and have kept My word. Little strength, faithfully used, is enough."
}
];
