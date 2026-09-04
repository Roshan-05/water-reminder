package com.roshankumarsah.waterreminder;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

public class FullScreenAlarmReceiver extends BroadcastReceiver {

    static final String CHANNEL_ID = "water-reminder-fullscreen";
    private static final int NOTIFICATION_ID = 5502;

    @Override
    public void onReceive(Context context, Intent receivedIntent) {
        ensureChannel(context);

        Intent contentIntent = new Intent(context, MainActivity.class);
        contentIntent.setAction(Intent.ACTION_VIEW);
        contentIntent.setData(Uri.parse("waterreminder://reminder"));
        contentIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        contentIntent.putExtra("showOverLockscreen", true);

        PendingIntent contentPendingIntent = PendingIntent.getActivity(
            context,
            5503,
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(context.getApplicationInfo().icon)
            .setContentTitle("Water Reminder")
            .setContentText("Time to drink some water!")
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setFullScreenIntent(contentPendingIntent, true)
            .setContentIntent(contentPendingIntent);

        NotificationManager notificationManager = (NotificationManager) context.getSystemService(
            Context.NOTIFICATION_SERVICE
        );
        notificationManager.notify(NOTIFICATION_ID, builder.build());
    }

    private void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }
        NotificationManager notificationManager = (NotificationManager) context.getSystemService(
            Context.NOTIFICATION_SERVICE
        );
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "Water reminder alarm",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription("Full-screen water reminder alerts");
        notificationManager.createNotificationChannel(channel);
    }
}
