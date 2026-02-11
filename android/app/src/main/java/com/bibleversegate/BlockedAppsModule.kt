package com.bibleversegate

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.util.Base64
import com.facebook.react.bridge.*
import java.io.ByteArrayOutputStream

class BlockedAppsModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "BlockedAppsModule"
    }

    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            android.util.Log.d("BlockedAppsModule", "getInstalledApps called")
            val pm = reactApplicationContext.packageManager

            // Get all apps that have a launcher icon (appear in app drawer)
            val mainIntent = Intent(Intent.ACTION_MAIN, null)
            mainIntent.addCategory(Intent.CATEGORY_LAUNCHER)
            val launcherApps = pm.queryIntentActivities(mainIntent, 0)

            android.util.Log.d("BlockedAppsModule", "Total launcher apps: ${launcherApps.size}")

            val appList = WritableNativeArray()
            val addedPackages = mutableSetOf<String>()

            for (resolveInfo in launcherApps) {
                val packageName = resolveInfo.activityInfo.packageName

                // Skip our own app and avoid duplicates
                if (packageName == reactApplicationContext.packageName || addedPackages.contains(packageName)) {
                    continue
                }

                try {
                    val appInfo = pm.getApplicationInfo(packageName, 0)
                    val appData = WritableNativeMap()
                    appData.putString("packageName", packageName)
                    appData.putString("appName", pm.getApplicationLabel(appInfo).toString())

                    // Get app icon as base64
                    val icon = pm.getApplicationIcon(appInfo)
                    val iconBase64 = drawableToBase64(icon)
                    appData.putString("icon", iconBase64)

                    appList.pushMap(appData)
                    addedPackages.add(packageName)

                    android.util.Log.d("BlockedAppsModule", "Found app: $packageName")
                } catch (e: Exception) {
                    android.util.Log.e("BlockedAppsModule", "Error processing app: $packageName", e)
                }
            }

            android.util.Log.d("BlockedAppsModule", "Returning ${appList.size()} apps")
            promise.resolve(appList)
        } catch (e: Exception) {
            android.util.Log.e("BlockedAppsModule", "Error getting apps", e)
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try {
            val blockedApps = BlockedAppsManager.getBlockedApps(reactApplicationContext)
            val array = WritableNativeArray()

            for (packageName in blockedApps) {
                array.pushString(packageName)
            }

            promise.resolve(array)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun addBlockedApp(packageName: String, promise: Promise) {
        try {
            BlockedAppsManager.addBlockedApp(reactApplicationContext, packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun removeBlockedApp(packageName: String, promise: Promise) {
        try {
            BlockedAppsManager.removeBlockedApp(reactApplicationContext, packageName)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setBlockedApps(packageNames: ReadableArray, promise: Promise) {
        try {
            val appsSet = mutableSetOf<String>()
            for (i in 0 until packageNames.size()) {
                packageNames.getString(i)?.let { appsSet.add(it) }
            }
            BlockedAppsManager.setBlockedApps(reactApplicationContext, appsSet)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        try {
            val granted = checkUsageStatsPermission()
            android.util.Log.d("BlockedAppsModule", "hasUsageStatsPermission: $granted")
            promise.resolve(granted)
        } catch (e: Exception) {
            android.util.Log.e("BlockedAppsModule", "Error checking permission", e)
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun openUsageAccessSettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun checkUsageStatsPermission(): Boolean {
        val appOpsManager = reactApplicationContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOpsManager.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            reactApplicationContext.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        try {
            val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Settings.canDrawOverlays(reactApplicationContext)
            } else {
                true
            }
            promise.resolve(hasPermission)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${reactApplicationContext.packageName}")
                )
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getCountdownTime(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
            val countdownTime = prefs.getInt("countdown_time", 5)
            promise.resolve(countdownTime)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setCountdownTime(seconds: Int, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
            prefs.edit().putInt("countdown_time", seconds).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getAppUsageStats(promise: Promise) {
        try {
            val usageStatsManager = reactApplicationContext.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager

            val endTime = System.currentTimeMillis()
            val startTime = endTime - (24 * 60 * 60 * 1000) // Last 24 hours

            val usageStatsList = usageStatsManager.queryUsageStats(
                UsageStatsManager.INTERVAL_DAILY,
                startTime,
                endTime
            )

            val usageMap = WritableNativeMap()
            for (usageStats in usageStatsList) {
                if (usageStats.totalTimeInForeground > 0) {
                    usageMap.putDouble(usageStats.packageName, usageStats.totalTimeInForeground.toDouble())
                }
            }

            promise.resolve(usageMap)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun isBatteryOptimizationDisabled(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val powerManager = reactApplicationContext.getSystemService(Context.POWER_SERVICE) as PowerManager
                val isIgnoringBatteryOptimizations = powerManager.isIgnoringBatteryOptimizations(reactApplicationContext.packageName)
                promise.resolve(isIgnoringBatteryOptimizations)
            } else {
                // Battery optimization doesn't exist on older Android versions
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun requestBatteryOptimizationExemption(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                intent.data = Uri.parse("package:${reactApplicationContext.packageName}")
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                reactApplicationContext.startActivity(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun hasSeenOnboarding(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
            val hasSeenOnboarding = prefs.getBoolean("has_seen_onboarding", false)
            promise.resolve(hasSeenOnboarding)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setOnboardingComplete(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
            prefs.edit().putBoolean("has_seen_onboarding", true).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getThemePreference(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
            val theme = prefs.getString("theme_preference", "dark") ?: "dark"
            promise.resolve(theme)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setThemePreference(theme: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
            prefs.edit().putString("theme_preference", theme).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getBibleVersion(promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
            val version = prefs.getString("bible_version", "KJV") ?: "KJV"
            promise.resolve(version)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun setBibleVersion(version: String, promise: Promise) {
        try {
            val prefs = reactApplicationContext.getSharedPreferences("BibleVerseGatePrefs", Context.MODE_PRIVATE)
            prefs.edit().putString("bible_version", version).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = if (drawable is BitmapDrawable) {
            drawable.bitmap
        } else {
            val bitmap = Bitmap.createBitmap(
                drawable.intrinsicWidth,
                drawable.intrinsicHeight,
                Bitmap.Config.ARGB_8888
            )
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            bitmap
        }

        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outputStream)
        val byteArray = outputStream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.DEFAULT)
    }
}
