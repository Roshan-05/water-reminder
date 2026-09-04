package com.roshankumarsah.waterreminder;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FullScreenReminderPlugin.class);
        registerPlugin(OverlayReminderPlugin.class);
        super.onCreate(savedInstanceState);
        applyShowOverLockscreen(getIntent());
    }

    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        applyShowOverLockscreen(intent);
    }

    private void applyShowOverLockscreen(Intent intent) {
        if (intent == null || !intent.getBooleanExtra("showOverLockscreen", false)) {
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
    }
}
