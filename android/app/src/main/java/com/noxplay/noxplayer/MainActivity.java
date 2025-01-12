package com.noxplay.noxplayer;
import expo.modules.ReactActivityDelegateWrapper;

import android.app.PictureInPictureParams;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.os.PersistableBundle;
import android.util.Log;
import android.util.Rational;

import androidx.annotation.Nullable;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

public class MainActivity extends ReactActivity {
  /**
   * for react navigation;
   */
  @Override
  protected void onCreate(Bundle savedInstanceState) {

    super.onCreate(null);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
      setShowWhenLocked(true);
      setTurnScreenOn(true);
    }
  }
  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
    return "azusa-player-mobile";
  }

    /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled()));
  }

  @Override
  protected void onStart() {
    super.onStart();
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return;
    }
    var params = new PictureInPictureParams.Builder()
      .setAspectRatio(new Rational(239, 100))
      .setSeamlessResizeEnabled(false)
      .setAutoEnterEnabled(true)
      .build();
    setPictureInPictureParams(params);
  }

  @Override
  public void onPictureInPictureModeChanged (boolean isInPictureInPictureMode, Configuration newConfig) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    if (isInPictureInPictureMode) {
      // Hide the full-screen UI (controls, etc.) while in PiP mode.
      this.getReactInstanceManager().getCurrentReactContext()
        .getJSModule(RCTDeviceEventEmitter.class)
        .emit("APMEnterPIP", true);
      // HACK: a really stupid way to continue RN UI rendering
      this.onResume();
    } else {
      // Restore the full-screen UI.
      getReactInstanceManager().getCurrentReactContext()
        .getJSModule(RCTDeviceEventEmitter.class)
        .emit("APMEnterPIP", false);
    }
    super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);
  }

}
