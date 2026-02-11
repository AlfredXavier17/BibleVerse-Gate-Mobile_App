package com.bibleversegate

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Log.d("BibleVerseGate", "BootReceiver triggered with action: ${intent.action}")

        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {

            Log.d("BibleVerseGate", "Boot/Update completed - starting AppUsageService")

            try {
                val serviceIntent = Intent(context, AppUsageService::class.java)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    context.startForegroundService(serviceIntent)
                    Log.d("BibleVerseGate", "Started foreground service")
                } else {
                    context.startService(serviceIntent)
                    Log.d("BibleVerseGate", "Started service")
                }
            } catch (e: Exception) {
                Log.e("BibleVerseGate", "Failed to start service from boot", e)
            }
        }
    }
}
