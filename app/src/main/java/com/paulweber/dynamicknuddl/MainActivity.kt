package com.paulweber.dynamicknuddl

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.paulweber.dynamicknuddl.ui.PixelGrid
import com.paulweber.dynamicknuddl.ui.theme.DynamicKnuddlTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            DynamicKnuddlTheme {
                val viewModel = PetViewModel()
                PetScreen(viewModel)
            }
        }
    }
}

@Composable
fun PetScreen(viewModel: PetViewModel) {
    val density = LocalDensity.current
    val configuration = LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp.dp
    val screenWidth = configuration.screenWidthDp.dp

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.surface)
    ) {
        // The "Hole" representation (where the camera is)
        // On many Androids it's top-center or top-left. Let's assume top-center for this "Expressive" design.
        // We use WindowInsets to get the actual cutout if possible, but for a "creative" app, 
        // we can also let the user drag the chicken or position it.
        
        Column(
            modifier = Modifier.fillMaxSize(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(48.dp)) // Approximate area of the camera
            
            // The Chicken living above the hole
            val frames = ChickenSprites.getFrames(viewModel.currentState)
            val currentSprite = if (frames.isNotEmpty()) frames[viewModel.currentFrame % frames.size] else ChickenSprites.idle1
            
            Box(contentAlignment = Alignment.BottomCenter) {
                // Background "Home" for the chicken
                Box(
                    modifier = Modifier
                        .size(120.dp, 60.dp)
                        .clip(RoundedCornerShape(topStart = 60.dp, topEnd = 60.dp))
                        .background(MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.3f))
                )

                PixelGrid(
                    sprite = currentSprite,
                    pixelSize = 4.dp,
                    modifier = Modifier
                        .padding(bottom = 8.dp)
                        .animateContentSize()
                )
                
                // Extra items like corn when eating
                if (viewModel.currentState == PetState.EATING) {
                    PixelGrid(
                        sprite = ChickenSprites.corn,
                        pixelSize = 3.dp,
                        modifier = Modifier.offset(y = 20.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // The "Camera Hole" visual interaction
            Surface(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape),
                color = Color.Black
            ) {
                // Maybe the chicken "looks" into the hole
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            // Material 3 Expressive UI - Large, playful controls
            ExpressiveControls(viewModel)
            
            Spacer(modifier = Modifier.height(48.dp))
        }
    }
}

@Composable
fun ExpressiveControls(viewModel: PetViewModel) {
    Card(
        modifier = Modifier
            .padding(24.dp)
            .fillMaxWidth(),
        shape = RoundedCornerShape(32.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.secondaryContainer
        )
    ) {
        Column(
            modifier = Modifier.padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Chicken Life",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.ExtraBold,
                    letterSpacing = 2.sp
                ),
                color = MaterialTheme.colorScheme.onSecondaryContainer
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                ControlButton(
                    icon = Icons.Default.Restaurant,
                    label = "Feed",
                    onClick = { viewModel.feed() }
                )
                ControlButton(
                    icon = Icons.Default.Favorite,
                    label = "Play",
                    onClick = { viewModel.play() }
                )
                ControlButton(
                    icon = Icons.Default.Settings,
                    label = "Menu",
                    onClick = { viewModel.toggleMenu() }
                )
            }
        }
    }
}

@Composable
fun ControlButton(
    icon: ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        FilledTonalIconButton(
            onClick = onClick,
            modifier = Modifier.size(64.dp),
            shape = RoundedCornerShape(20.dp)
        ) {
            Icon(icon, contentDescription = label, modifier = Modifier.size(32.dp))
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            modifier = Modifier.padding(top = 8.dp)
        )
    }
}
