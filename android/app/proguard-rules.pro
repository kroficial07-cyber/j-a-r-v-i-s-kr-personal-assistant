# Proguard rules for J.A.R.V.I.S. Android
-keep class com.kr.jarvis.data.local.** { *; }
-keepclassmembers class * extends androidx.room.RoomDatabase { *; }
-dontwarn okio.**
