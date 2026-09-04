package com.roshankumarsah.waterreminder;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.webkit.WebViewAssetLoader;

public class OverlayReminderService extends Service {

    private static final String CHANNEL_ID = "water-reminder-overlay-service";
    private static final int NOTIFICATION_ID = 5504;
    private static final float WIDTH_DP = 340f;
    private static final float HEIGHT_DP = 400f;

    private WindowManager windowManager;
    private WebView webView;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate() {
        super.onCreate();
        startForeground(NOTIFICATION_ID, buildServiceNotification());
        showOverlay();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        return START_NOT_STICKY;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        removeOverlayView();
        super.onDestroy();
    }

    private void showOverlay() {
        if (webView != null) return;

        windowManager = (WindowManager) getSystemService(Context.WINDOW_SERVICE);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        webView.setBackgroundColor(0x00000000);
        webView.addJavascriptInterface(new OverlayBridge(), "AndroidOverlay");

        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
            .setDomain("localhost")
            .addPathHandler("/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        webView.setWebViewClient(new WebViewClient() {
            @Override
            @Nullable
            public WebResourceResponse shouldInterceptRequest(WebView view, android.webkit.WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
        });

        webView.loadUrl("https://localhost/public/overlay.html");

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
            dpToPx(WIDTH_DP),
            dpToPx(HEIGHT_DP),
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.BOTTOM | Gravity.END;
        params.x = dpToPx(16f);
        params.y = dpToPx(24f);

        windowManager.addView(webView, params);
    }

    private void removeOverlayView() {
        if (webView != null && windowManager != null) {
            try {
                windowManager.removeView(webView);
            } catch (IllegalArgumentException ignored) {
                // View was already detached.
            }
            webView.destroy();
            webView = null;
        }
    }

    private int dpToPx(float dp) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, getResources().getDisplayMetrics());
    }

    private android.app.Notification buildServiceNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Water reminder overlay",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Keeps the floating water reminder visible");
            notificationManager.createNotificationChannel(channel);
        }
        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(getApplicationInfo().icon)
            .setContentTitle("Water Reminder")
            .setContentText("Reminder is showing on screen")
            .setOngoing(true)
            .build();
    }

    private class OverlayBridge {
        @JavascriptInterface
        public void dismiss() {
            mainHandler.post(() -> {
                removeOverlayView();
                stopSelf();
            });
        }
    }
}
