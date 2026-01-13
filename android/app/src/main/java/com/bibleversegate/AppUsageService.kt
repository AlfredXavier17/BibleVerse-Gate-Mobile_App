package com.bibleversegate

import android.app.*
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import java.util.SortedMap
import java.util.TreeMap

class AppUsageService : Service() {

    private val TAG = "BibleVerseGate"
    private var running = true
    private val CHANNEL_ID = "BibleVerseGateChannel"
    private var lastBlockedPackage: String? = null
    private var activeSessionApp: String? = null // Track app with active session

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val notification = Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("Bible Verse Gate")
            .setContentText("Monitoring app usage")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .build()

        startForeground(1, notification)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "AppUsageService started - Beginning monitoring")
        Thread {
            while (running) {
                try {
                    checkForegroundApp()
                } catch (e: Exception) {
                    Log.e(TAG, "Error checking foreground app", e)
                }
                Thread.sleep(10) // Check every 10ms for instant blocking
            }
        }.start()

        return START_STICKY
    }

    private fun checkForegroundApp() {
        val usageStatsManager =
            getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager? ?: return

        val time = System.currentTimeMillis()
        val usageEvents = usageStatsManager.queryEvents(time - 2000, time)

        val appMap: SortedMap<Long, String> = TreeMap()
        val event = UsageEvents.Event()

        while (usageEvents.hasNextEvent()) {
            usageEvents.getNextEvent(event)
            if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                appMap[event.timeStamp] = event.packageName
            }
        }

        if (appMap.isNotEmpty()) {
            val currentApp = appMap[appMap.lastKey()]

            // Skip if it's our own package or gate activity, but reset tracking
            if (currentApp == packageName) {
                lastBlockedPackage = null
                return
            }

            Log.d(TAG, "Foreground app: $currentApp")

            // Check SharedPreferences for active session
            val prefs = getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
            activeSessionApp = prefs.getString("active_session_app", null)

            // Check if this app has an active session
            if (currentApp == activeSessionApp) {
                // User is using an app they clicked "Continue" on - allow it
                Log.d(TAG, "Active session for: $currentApp")
                return
            } else if (activeSessionApp != null && currentApp != activeSessionApp) {
                // User switched to a different app - clear active session
                Log.d(TAG, "Clearing active session for: $activeSessionApp")
                prefs.edit().remove("active_session_app").apply()
                activeSessionApp = null
            }

            // Check if this app is blocked
            if (currentApp != null && BlockedAppsManager.isBlocked(this, currentApp)) {
                // Only launch if this is a new app or we returned from another app
                if (lastBlockedPackage != currentApp) {
                    Log.d(TAG, "Blocked app detected: $currentApp - Launching gate")
                    lastBlockedPackage = currentApp
                    launchBibleVerseGate(currentApp)
                }
            } else {
                // Reset tracking when user is on any non-blocked app
                lastBlockedPackage = null
            }
        }
    }

    private fun launchBibleVerseGate(packageName: String) {
        Log.d(TAG, "Launching Bible Verse Gate for: $packageName")

        val intent = Intent(this, BibleVerseGateActivity::class.java)
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK or
            Intent.FLAG_ACTIVITY_CLEAR_TASK or
            Intent.FLAG_ACTIVITY_NO_HISTORY or
            Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS
        )
        intent.putExtra("BLOCKED_PACKAGE", packageName)

        try {
            startActivity(intent)
            Log.d(TAG, "Bible Verse Gate activity launched successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch Bible Verse Gate activity", e)
        }
    }

    override fun onDestroy() {
        running = false
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Bible Verse Gate Service",
                NotificationManager.IMPORTANCE_HIGH
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
