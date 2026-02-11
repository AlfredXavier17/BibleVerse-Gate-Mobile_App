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
import org.json.JSONArray

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

    private fun loadVersesFromAssets(): List<Verse> {
        val prefs = getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
        val version = prefs.getString("bible_version", "KJV") ?: "KJV"
        val fileName = if (version == "WEB") "verses_web.json" else "verses_kjv.json"

        return try {
            val jsonString = assets.open(fileName).bufferedReader().use { it.readText() }
            val jsonArray = JSONArray(jsonString)
            val verses = mutableListOf<Verse>()
            for (i in 0 until jsonArray.length()) {
                val obj = jsonArray.getJSONObject(i)
                verses.add(Verse(obj.getString("text"), obj.getString("reference")))
            }
            verses
        } catch (e: Exception) {
            // Fallback verse if JSON loading fails
            listOf(Verse("Trust in the Lord with all thine heart and lean not unto thine own understanding", "Proverbs 3:5"))
        }
    }

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
        val bibleVerses = loadVersesFromAssets()
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
