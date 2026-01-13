package com.bibleversegate

import android.content.Context
import android.content.SharedPreferences

object BlockedAppsManager {

    private const val PREFS_NAME = "BibleVerseGatePrefs"
    private const val KEY_BLOCKED_APPS = "blocked_apps"
    private const val KEY_TEMP_ALLOWANCE = "temp_allowance"
    private const val ALLOWANCE_DURATION = 30000L // 30 seconds

    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getBlockedApps(context: Context): Set<String> {
        val prefs = getPrefs(context)
        return prefs.getStringSet(KEY_BLOCKED_APPS, setOf()) ?: setOf()
    }

    fun setBlockedApps(context: Context, apps: Set<String>) {
        val prefs = getPrefs(context)
        prefs.edit().putStringSet(KEY_BLOCKED_APPS, apps).apply()
    }

    fun addBlockedApp(context: Context, packageName: String) {
        val currentApps = getBlockedApps(context).toMutableSet()
        currentApps.add(packageName)
        setBlockedApps(context, currentApps)
    }

    fun removeBlockedApp(context: Context, packageName: String) {
        val currentApps = getBlockedApps(context).toMutableSet()
        currentApps.remove(packageName)
        setBlockedApps(context, currentApps)
    }

    fun isBlocked(context: Context, packageName: String): Boolean {
        // Ignore our own app
        if (packageName == context.packageName) {
            return false
        }

        // Check if there's a temporary allowance
        if (hasTemporaryAllowance(context, packageName)) {
            return false
        }

        return getBlockedApps(context).contains(packageName)
    }

    fun setTemporaryAllowance(context: Context, packageName: String) {
        val prefs = getPrefs(context)
        val expiryTime = System.currentTimeMillis() + ALLOWANCE_DURATION
        prefs.edit().putLong("${KEY_TEMP_ALLOWANCE}_$packageName", expiryTime).apply()
    }

    private fun hasTemporaryAllowance(context: Context, packageName: String): Boolean {
        val prefs = getPrefs(context)
        val expiryTime = prefs.getLong("${KEY_TEMP_ALLOWANCE}_$packageName", 0)
        val currentTime = System.currentTimeMillis()

        if (currentTime < expiryTime) {
            return true
        } else if (expiryTime > 0) {
            // Clean up expired allowance
            prefs.edit().remove("${KEY_TEMP_ALLOWANCE}_$packageName").apply()
        }

        return false
    }
}
