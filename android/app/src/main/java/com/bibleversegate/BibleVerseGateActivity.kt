package com.bibleversegate

import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.random.Random

data class Verse(val text: String, val reference: String)

class BibleVerseGateActivity : Activity() {

    private var countdownSeconds = 5
    private var initialCountdown = 5
    private val handler = Handler(Looper.getMainLooper())
    private var continueButton: Button? = null
    private var closeButton: Button? = null
    private var buttonLayout: LinearLayout? = null
    private var countdownText: TextView? = null
    private var blockedPackageName: String? = null
    private var blockedAppName: String? = null

    private val bibleVerses = listOf(
        Verse("I can do all things through Christ which strengtheneth me", "Philippians 4:13"),
        Verse("Whether therefore ye eat or drink or whatsoever ye do do all to the glory of God", "1 Corinthians 10:31"),
        Verse("For God hath not given us the spirit of fear but of power and of love and of a sound mind", "2 Timothy 1:7"),
        Verse("Trust in the Lord with all thine heart and lean not unto thine own understanding", "Proverbs 3:5"),
        Verse("And we know that all things work together for good to them that love God to them who are the called according to his purpose", "Romans 8:28"),
        Verse("But seek ye first the kingdom of God and his righteousness and all these things shall be added unto you", "Matthew 6:33"),
        Verse("Be strong and of a good courage fear not nor be afraid of them for the Lord thy God he it is that doth go with thee he will not fail thee nor forsake thee", "Deuteronomy 31:6"),
        Verse("The Lord is my shepherd I shall not want", "Psalm 23:1"),
        Verse("For I know the plans I have for you declares the Lord plans to prosper you and not to harm you plans to give you hope and a future", "Jeremiah 29:11"),
        Verse("Commit thy works unto the Lord and thy thoughts shall be established", "Proverbs 16:3"),
        Verse("The Lord is my light and my salvation whom shall I fear the Lord is the strength of my life of whom shall I be afraid", "Psalm 27:1"),
        Verse("Cast thy burden upon the Lord and he shall sustain thee he shall never suffer the righteous to be moved", "Psalm 55:22"),
        Verse("Therefore if any man be in Christ he is a new creature old things are passed away behold all things are become new", "2 Corinthians 5:17"),
        Verse("Be careful for nothing but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God", "Philippians 4:6"),
        Verse("And the peace of God which passeth all understanding shall keep your hearts and minds through Christ Jesus", "Philippians 4:7"),
        Verse("The name of the Lord is a strong tower the righteous runneth into it and is safe", "Proverbs 18:10"),
        Verse("But they that wait upon the Lord shall renew their strength they shall mount up with wings as eagles they shall run and not be weary and they shall walk and not faint", "Isaiah 40:31"),
        Verse("Delight thyself also in the Lord and he shall give thee the desires of thine heart", "Psalm 37:4"),
        Verse("Create in me a clean heart O God and renew a right spirit within me", "Psalm 51:10"),
        Verse("The Lord will perfect that which concerneth me thy mercy O Lord endureth for ever forsake not the works of thine own hands", "Psalm 138:8"),
        Verse("For by grace are ye saved through faith and that not of yourselves it is the gift of God", "Ephesians 2:8"),
        Verse("Being confident of this very thing that he which hath begun a good work in you will perform it until the day of Jesus Christ", "Philippians 1:6"),
        Verse("Humble yourselves therefore under the mighty hand of God that he may exalt you in due time", "1 Peter 5:6"),
        Verse("Casting all your care upon him for he careth for you", "1 Peter 5:7"),
        Verse("Draw nigh to God and he will draw nigh to you", "James 4:8"),
        Verse("For where two or three are gathered together in my name there am I in the midst of them", "Matthew 18:20"),
        Verse("Let your light so shine before men that they may see your good works and glorify your Father which is in heaven", "Matthew 5:16"),
        Verse("But as it is written Eye hath not seen nor ear heard neither have entered into the heart of man the things which God hath prepared for them that love him", "1 Corinthians 2:9"),
        Verse("For the word of God is quick and powerful and sharper than any twoedged sword piercing even to the dividing asunder of soul and spirit and of the joints and marrow and is a discerner of the thoughts and intents of the heart", "Hebrews 4:12"),
        Verse("This is the day which the Lord hath made we will rejoice and be glad in it", "Psalm 118:24"),
        Verse("The Lord bless thee and keep thee", "Numbers 6:24"),
        Verse("The Lord make his face shine upon thee and be gracious unto thee", "Numbers 6:25"),
        Verse("The Lord lift up his countenance upon thee and give thee peace", "Numbers 6:26"),
        Verse("In all thy ways acknowledge him and he shall direct thy paths", "Proverbs 3:6"),
        Verse("A soft answer turneth away wrath but grievous words stir up anger", "Proverbs 15:1"),
        Verse("A merry heart doeth good like a medicine but a broken spirit drieth the bones", "Proverbs 17:22"),
        Verse("The fear of the Lord is the beginning of wisdom and the knowledge of the holy is understanding", "Proverbs 9:10"),
        Verse("For God so loved the world that he gave his only begotten Son that whosoever believeth in him should not perish but have everlasting life", "John 3:16"),
        Verse("Come unto me all ye that labour and are heavy laden and I will give you rest", "Matthew 11:28"),
        Verse("Take my yoke upon you and learn of me for I am meek and lowly in heart and ye shall find rest unto your souls", "Matthew 11:29"),
        Verse("And whatsoever ye do do it heartily as to the Lord and not unto men", "Colossians 3:23"),
        Verse("If we confess our sins he is faithful and just to forgive us our sins and to cleanse us from all unrighteousness", "1 John 1:9"),
        Verse("For all have sinned and come short of the glory of God", "Romans 3:23"),
        Verse("For the wages of sin is death but the gift of God is eternal life through Jesus Christ our Lord", "Romans 6:23"),
        Verse("That if thou shalt confess with thy mouth the Lord Jesus and shalt believe in thine heart that God hath raised him from the dead thou shalt be saved", "Romans 10:9"),
        Verse("For whosoever shall call upon the name of the Lord shall be saved", "Romans 10:13"),
        Verse("Behold I stand at the door and knock if any man hear my voice and open the door I will come in to him and will sup with him and he with me", "Revelation 3:20"),
        Verse("Jesus saith unto him I am the way the truth and the life no man cometh unto the Father but by me", "John 14:6"),
        Verse("These things I have spoken unto you that in me ye might have peace In the world ye shall have tribulation but be of good cheer I have overcome the world", "John 16:33"),
        Verse("There hath no temptation taken you but such as is common to man but God is faithful who will not suffer you to be tempted above that ye are able but will with the temptation also make a way to escape that ye may be able to bear it", "1 Corinthians 10:13"),
        Verse("Nay in all these things we are more than conquerors through him that loved us", "Romans 8:37"),
        Verse("For I am persuaded that neither death nor life nor angels nor principalities nor powers nor things present nor things to come", "Romans 8:38"),
        Verse("Nor height nor depth nor any other creature shall be able to separate us from the love of God which is in Christ Jesus our Lord", "Romans 8:39"),
        Verse("Let all bitterness and wrath and anger and clamour and evil speaking be put away from you with all malice", "Ephesians 4:31"),
        Verse("And be ye kind one to another tenderhearted forgiving one another even as God for Christ's sake hath forgiven you", "Ephesians 4:32"),
        Verse("Let this mind be in you which was also in Christ Jesus", "Philippians 2:5"),
        Verse("Rejoice in the Lord alway and again I say Rejoice", "Philippians 4:4"),
        Verse("Let your moderation be known unto all men The Lord is at hand", "Philippians 4:5"),
        Verse("Finally brethren whatsoever things are true whatsoever things are honest whatsoever things are just whatsoever things are pure whatsoever things are lovely whatsoever things are of good report if there be any virtue and if there be any praise think on these things", "Philippians 4:8"),
        Verse("Not that I speak in respect of want for I have learned in whatsoever state I am therewith to be content", "Philippians 4:11"),
        Verse("But my God shall supply all your need according to his riches in glory by Christ Jesus", "Philippians 4:19"),
        Verse("Set your affection on things above not on things on the earth", "Colossians 3:2"),
        Verse("And let the peace of God rule in your hearts to the which also ye are called in one body and be ye thankful", "Colossians 3:15"),
        Verse("Let the word of Christ dwell in you richly in all wisdom teaching and admonishing one another in psalms and hymns and spiritual songs singing with grace in your hearts to the Lord", "Colossians 3:16"),
        Verse("And whatsoever ye do in word or deed do all in the name of the Lord Jesus giving thanks to God and the Father by him", "Colossians 3:17"),
        Verse("Pray without ceasing", "1 Thessalonians 5:17"),
        Verse("In every thing give thanks for this is the will of God in Christ Jesus concerning you", "1 Thessalonians 5:18"),
        Verse("Now the God of peace sanctify you wholly and I pray God your whole spirit and soul and body be preserved blameless unto the coming of our Lord Jesus Christ", "1 Thessalonians 5:23"),
        Verse("Faithful is he that calleth you who also will do it", "1 Thessalonians 5:24"),
        Verse("Let us hold fast the profession of our faith without wavering for he is faithful that promised", "Hebrews 10:23"),
        Verse("Now faith is the substance of things hoped for the evidence of things not seen", "Hebrews 11:1"),
        Verse("But without faith it is impossible to please him for he that cometh to God must believe that he is and that he is a rewarder of them that diligently seek him", "Hebrews 11:6"),
        Verse("Looking unto Jesus the author and finisher of our faith who for the joy that was set before him endured the cross despising the shame and is set down at the right hand of the throne of God", "Hebrews 12:2"),
        Verse("Let brotherly love continue", "Hebrews 13:1"),
        Verse("Jesus Christ the same yesterday and to day and for ever", "Hebrews 13:8"),
        Verse("If any of you lack wisdom let him ask of God that giveth to all men liberally and upbraideth not and it shall be given him", "James 1:5"),
        Verse("But let him ask in faith nothing wavering For he that wavereth is like a wave of the sea driven with the wind and tossed", "James 1:6"),
        Verse("Blessed is the man that endureth temptation for when he is tried he shall receive the crown of life which the Lord hath promised to them that love him", "James 1:12"),
        Verse("Every good gift and every perfect gift is from above and cometh down from the Father of lights with whom is no variableness neither shadow of turning", "James 1:17"),
        Verse("Wherefore my beloved brethren let every man be swift to hear slow to speak slow to wrath", "James 1:19"),
        Verse("But be ye doers of the word and not hearers only deceiving your own selves", "James 1:22"),
        Verse("Pure religion and undefiled before God and the Father is this To visit the fatherless and widows in their affliction and to keep himself unspotted from the world", "James 1:27"),
        Verse("Yea a man may say Thou hast faith and I have works shew me thy faith without thy works and I will shew thee my faith by my works", "James 2:18"),
        Verse("Submit yourselves therefore to God Resist the devil and he will flee from you", "James 4:7"),
        Verse("Confess your faults one to another and pray one for another that ye may be healed The effectual fervent prayer of a righteous man availeth much", "James 5:16"),
        Verse("Blessed be the God and Father of our Lord Jesus Christ which according to his abundant mercy hath begotten us again unto a lively hope by the resurrection of Jesus Christ from the dead", "1 Peter 1:3"),
        Verse("Wherein ye greatly rejoice though now for a season if need be ye are in heaviness through manifold temptations", "1 Peter 1:6"),
        Verse("That the trial of your faith being much more precious than of gold that perisheth though it be tried with fire might be found unto praise and honour and glory at the appearing of Jesus Christ", "1 Peter 1:7"),
        Verse("Whom having not seen ye love in whom though now ye see him not yet believing ye rejoice with joy unspeakable and full of glory", "1 Peter 1:8"),
        Verse("But ye are a chosen generation a royal priesthood an holy nation a peculiar people that ye should shew forth the praises of him who hath called you out of darkness into his marvellous light", "1 Peter 2:9"),
        Verse("For even hereunto were ye called because Christ also suffered for us leaving us an example that ye should follow his steps", "1 Peter 2:21"),
        Verse("Who his own self bare our sins in his own body on the tree that we being dead to sins should live unto righteousness by whose stripes ye were healed", "1 Peter 2:24"),
        Verse("Likewise ye husbands dwell with them according to knowledge giving honour unto the wife as unto the weaker vessel and as being heirs together of the grace of life that your prayers be not hindered", "1 Peter 3:7"),
        Verse("Not rendering evil for evil or railing for railing but contrariwise blessing knowing that ye are thereunto called that ye should inherit a blessing", "1 Peter 3:9"),
        Verse("But sanctify the Lord God in your hearts and be ready always to give an answer to every man that asketh you a reason of the hope that is in you with meekness and fear", "1 Peter 3:15"),
        Verse("Be sober be vigilant because your adversary the devil as a roaring lion walketh about seeking whom he may devour", "1 Peter 5:8"),
        Verse("Whom resist stedfast in the faith knowing that the same afflictions are accomplished in your brethren that are in the world", "1 Peter 5:9"),
        Verse("But the God of all grace who hath called us unto his eternal glory by Christ Jesus after that ye have suffered a while make you perfect stablish strengthen settle you", "1 Peter 5:10"),
        Verse("Grace and peace be multiplied unto you through the knowledge of God and of Jesus our Lord", "2 Peter 1:2"),
        Verse("According as his divine power hath given unto us all things that pertain unto life and godliness through the knowledge of him that hath called us to glory and virtue", "2 Peter 1:3"),
        Verse("Whereby are given unto us exceeding great and precious promises that by these ye might be partakers of the divine nature having escaped the corruption that is in the world through lust", "2 Peter 1:4"),
        Verse("And beside this giving all diligence add to your faith virtue and to virtue knowledge", "2 Peter 1:5"),
        Verse("We know that we have passed from death unto life because we love the brethren He that loveth not his brother abideth in death", "1 John 3:14"),
        Verse("My little children let us not love in word neither in tongue but in deed and in truth", "1 John 3:18"),
        Verse("And hereby we know that he abideth in us by the Spirit which he hath given us", "1 John 3:24"),
        Verse("Beloved believe not every spirit but try the spirits whether they are of God because many false prophets are gone out into the world", "1 John 4:1"),
        Verse("Ye are of God little children and have overcome them because greater is he that is in you than he that is in the world", "1 John 4:4"),
        Verse("Herein is love not that we loved God but that he loved us and sent his Son to be the propitiation for our sins", "1 John 4:10"),
        Verse("Beloved if God so loved us we ought also to love one another", "1 John 4:11"),
        Verse("And we have known and believed the love that God hath to us God is love and he that dwelleth in love dwelleth in God and God in him", "1 John 4:16"),
        Verse("There is no fear in love but perfect love casteth out fear because fear hath torment He that feareth is not made perfect in love", "1 John 4:18"),
        Verse("We love him because he first loved us", "1 John 4:19"),
        Verse("If a man say I love God and hateth his brother he is a liar for he that loveth not his brother whom he hath seen how can he love God whom he hath not seen", "1 John 4:20"),
        Verse("And this commandment have we from him That he who loveth God love his brother also", "1 John 4:21"),
        Verse("For whatsoever is born of God overcometh the world and this is the victory that overcometh the world even our faith", "1 John 5:4"),
        Verse("And this is the confidence that we have in him that if we ask any thing according to his will he heareth us", "1 John 5:14"),
        Verse("And if we know that he hear us whatsoever we ask we know that we have the petitions that we desired of him", "1 John 5:15"),
        Verse("And we know that the Son of God is come and hath given us an understanding that we may know him that is true and we are in him that is true even in his Son Jesus Christ This is the true God and eternal life", "1 John 5:20"),
        Verse("Beloved I wish above all things that thou mayest prosper and be in health even as thy soul prospereth", "3 John 1:2"),
        Verse("Now unto him that is able to keep you from falling and to present you faultless before the presence of his glory with exceeding joy", "Jude 1:24"),
        Verse("To the only wise God our Saviour be glory and majesty dominion and power both now and ever Amen", "Jude 1:25"),
        Verse("Fear thou not for I am with thee be not dismayed for I am thy God I will strengthen thee yea I will help thee yea I will uphold thee with the right hand of my righteousness", "Isaiah 41:10"),
        Verse("When thou passest through the waters I will be with thee and through the rivers they shall not overflow thee when thou walkest through the fire thou shalt not be burned neither shall the flame kindle upon thee", "Isaiah 43:2"),
        Verse("Be still and know that I am God I will be exalted among the heathen I will be exalted in the earth", "Psalm 46:10"),
        Verse("The Lord thy God in the midst of thee is mighty he will save he will rejoice over thee with joy he will rest in his love he will joy over thee with singing", "Zephaniah 3:17"),
        Verse("Call unto me and I will answer thee and shew thee great and mighty things which thou knowest not", "Jeremiah 33:3"),
        Verse("A new commandment I give unto you That ye love one another as I have loved you that ye also love one another", "John 13:34"),
        Verse("By this shall all men know that ye are my disciples if ye have love one to another", "John 13:35"),
        Verse("Let not your heart be troubled ye believe in God believe also in me", "John 14:1"),
        Verse("Peace I leave with you my peace I give unto you not as the world giveth give I unto you Let not your heart be troubled neither let it be afraid", "John 14:27")
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Make it full screen and show over lockscreen
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
        )

        // Get the blocked app package name
        blockedPackageName = intent.getStringExtra("BLOCKED_PACKAGE")

        // Get app name from package name
        blockedAppName = try {
            val pm = packageManager
            val appInfo = pm.getApplicationInfo(blockedPackageName ?: "", 0)
            pm.getApplicationLabel(appInfo).toString()
        } catch (e: Exception) {
            "this app"
        }

        // Load countdown time from preferences
        val prefs = getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
        countdownSeconds = prefs.getInt("countdown_time", 5)
        initialCountdown = countdownSeconds

        setContentView(R.layout.activity_bible_verse_gate)

        // Initialize views
        val verseTextView = findViewById<TextView>(R.id.verseText)
        val statsTextView = findViewById<TextView>(R.id.statsText)
        closeButton = findViewById<Button>(R.id.closeButton)
        continueButton = findViewById<Button>(R.id.continueButton)
        buttonLayout = findViewById<LinearLayout>(R.id.buttonLayout)
        countdownText = findViewById<TextView>(R.id.countdownText)

        // Select a random Bible verse
        val randomVerse = bibleVerses[Random.nextInt(bibleVerses.size)]
        verseTextView.text = "\"${randomVerse.text}\"\n\n— ${randomVerse.reference}"

        // Track and display daily count
        blockedPackageName?.let { packageName ->
            incrementDailyCount(packageName)
            val count = getDailyCount(packageName)
            val timesText = if (count == 1) "time" else "times"
            statsTextView.text = "You've opened $blockedAppName $count $timesText today"
        }

        // Set initial countdown text
        countdownText?.text = countdownSeconds.toString()

        // Update button text with app name
        closeButton?.text = "I don't wanna use $blockedAppName"
        continueButton?.text = "Continue to $blockedAppName"

        // Initially hide buttons
        buttonLayout?.visibility = View.GONE

        // Close button - go back to home
        closeButton?.setOnClickListener {
            goHome()
        }

        // Continue button - launch the blocked app after countdown
        continueButton?.setOnClickListener {
            launchBlockedApp()
        }

        // Start countdown
        startCountdown()
    }

    private fun getTodayDateString(): String {
        val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        return dateFormat.format(Date())
    }

    private fun incrementDailyCount(packageName: String) {
        val prefs = getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
        val today = getTodayDateString()
        val key = "app_count_${packageName}_$today"
        val currentCount = prefs.getInt(key, 0)
        prefs.edit().putInt(key, currentCount + 1).apply()
    }

    private fun getDailyCount(packageName: String): Int {
        val prefs = getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
        val today = getTodayDateString()
        val key = "app_count_${packageName}_$today"
        return prefs.getInt(key, 0)
    }

    private fun startCountdown() {
        handler.postDelayed(object : Runnable {
            override fun run() {
                countdownSeconds--

                // Update countdown text
                countdownText?.text = countdownSeconds.toString()

                if (countdownSeconds > 0) {
                    handler.postDelayed(this, 1000)
                } else {
                    // Countdown complete - hide countdown, show buttons
                    countdownText?.visibility = View.GONE
                    buttonLayout?.visibility = View.VISIBLE
                }
            }
        }, 1000)
    }

    private fun goHome() {
        val homeIntent = android.content.Intent(android.content.Intent.ACTION_MAIN)
        homeIntent.addCategory(android.content.Intent.CATEGORY_HOME)
        homeIntent.flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(homeIntent)
        finish()
    }

    private fun launchBlockedApp() {
        blockedPackageName?.let { packageName ->
            val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
            if (launchIntent != null) {
                // Mark that we're intentionally launching this app
                BlockedAppsManager.setTemporaryAllowance(this, packageName)

                // Set active session so user can use app until they close it
                val prefs = getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
                prefs.edit().putString("active_session_app", packageName).apply()

                startActivity(launchIntent)
            }
        }
        finish()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }

    override fun onBackPressed() {
        // Prevent back button from dismissing the gate
        goHome()
    }
}
