package com.paulweber.dynamicknuddl

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Bundle
import android.os.IBinder
import android.view.Gravity
import android.view.WindowManager
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.unit.dp
import androidx.core.app.NotificationCompat
import androidx.lifecycle.*
import androidx.savedstate.SavedStateRegistry
import androidx.savedstate.SavedStateRegistryController
import androidx.savedstate.SavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner
import com.paulweber.dynamicknuddl.ui.PixelGrid
import kotlinx.coroutines.delay

class ChickenOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private var composeView: ComposeView? = null
    // We use a shared ViewModel instance (simulated here by a singleton-like property)
    companion object {
        val viewModel = PetViewModel()
    }

    private class OverlayLifecycleOwner : LifecycleOwner, ViewModelStoreOwner, SavedStateRegistryOwner {
        private val lifecycleRegistry = LifecycleRegistry(this)
        private val savedStateRegistryController = SavedStateRegistryController.create(this)
        private val _viewModelStore = ViewModelStore()

        override val lifecycle: Lifecycle get() = lifecycleRegistry
        override val viewModelStore: ViewModelStore get() = _viewModelStore
        override val savedStateRegistry: SavedStateRegistry get() = savedStateRegistryController.savedStateRegistry

        fun onCreate() {
            savedStateRegistryController.performRestore(null)
            lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_CREATE)
        }

        fun onResume() {
            lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_RESUME)
        }

        fun onDestroy() {
            lifecycleRegistry.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY)
            _viewModelStore.clear()
        }
    }

    private val lifecycleOwner = OverlayLifecycleOwner()

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        lifecycleOwner.onCreate()
        lifecycleOwner.onResume()

        createNotificationChannel()
        startForeground(1, createNotification())

        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        showOverlay()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.getStringExtra("EXTRA_ACTION")
        if (action != null) {
            when (action) {
                "FEED" -> viewModel.feed()
                "PLAY" -> viewModel.play()
                "FISH" -> viewModel.fish()
                "WALK" -> viewModel.walk()
            }
        }
        return START_STICKY
    }

    private fun showOverlay() {
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            x = 0
            y = 0 // Exactly at the top
        }

        composeView = ComposeView(this).apply {
            setViewTreeLifecycleOwner(lifecycleOwner)
            setViewTreeViewModelStoreOwner(lifecycleOwner)
            setViewTreeSavedStateRegistryOwner(lifecycleOwner)

            setContent {
                val state = viewModel.currentState
                val frame = viewModel.currentFrame
                
                val walkOffset by animateFloatAsState(
                    targetValue = if (state == PetState.WALKING) {
                        if (frame % 4 < 2) 50f else -50f
                    } else 0f,
                    animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow),
                    label = "WalkOffset"
                )

                val islandWidth by animateDpAsState(
                    targetValue = if (state == PetState.WALKING) 180.dp else 0.dp,
                    animationSpec = spring(stiffness = Spring.StiffnessVeryLow),
                    label = "IslandWidth"
                )

                Box(modifier = Modifier.wrapContentHeight().fillMaxWidth()) {
                    // Island Background
                    if (islandWidth > 0.dp) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopCenter)
                                .size(islandWidth, 36.dp)
                                .clip(RoundedCornerShape(bottomStart = 18.dp, bottomEnd = 18.dp))
                                .background(Color.Black.copy(alpha = 0.95f))
                        )
                    }

                    // Chicken - Exact Positioning as requested
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 1.dp) // Gap from top edge
                            .offset(x = walkOffset.dp),
                        contentAlignment = Alignment.TopCenter
                    ) {
                        val frames = ChickenSprites.getFrames(state)
                        val currentSprite = if (frames.isNotEmpty()) frames[frame % frames.size] else ChickenSprites.idle1

                        PixelGrid(
                            sprite = currentSprite,
                            pixelSize = 1.1.dp, // Requested size
                            modifier = Modifier.animateContentSize()
                        )

                        // Action-specific overlays
                        if (state == PetState.FISHING) {
                            val lineLength by animateFloatAsState(
                                targetValue = if (frame % 4 >= 1) 500f else 0f,
                                animationSpec = tween(1500),
                                label = "LineLength"
                            )
                            Box(
                                modifier = Modifier
                                    .offset(x = 10.dp, y = 10.dp)
                                    .size(1.dp, lineLength.dp)
                                    .background(Color.White.copy(alpha = 0.7f))
                            )
                            if (lineLength > 400f) {
                                val fishUpOffset by animateFloatAsState(
                                    targetValue = if (frame % 4 == 3) 12f else 400f,
                                    animationSpec = tween(2000),
                                    label = "FishCatch"
                                )
                                PixelGrid(
                                    sprite = ChickenSprites.tinyFish,
                                    pixelSize = 1.4.dp,
                                    modifier = Modifier.offset(x = 10.dp, y = fishUpOffset.dp)
                                )
                            }
                        }

                        if (state == PetState.EATING) {
                            PixelGrid(
                                sprite = ChickenSprites.corn,
                                pixelSize = 0.8.dp,
                                modifier = Modifier.offset(y = 15.dp)
                            )
                        }
                    }
                }
            }
        }

        windowManager.addView(composeView, params)
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            "chicken_service",
            "Chicken Overlay Service",
            NotificationManager.IMPORTANCE_LOW
        )
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, "chicken_service")
            .setContentTitle("Chicken Activity")
            .setContentText("Your pet is exploring the status bar!")
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        lifecycleOwner.onDestroy()
        composeView?.let { windowManager.removeView(it) }
    }
}
