package com.paulweber.dynamicknuddl.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun PixelGrid(
    sprite: List<List<Color?>>,
    pixelSize: Dp = 2.dp,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        sprite.forEach { row ->
            Row {
                row.forEach { color ->
                    Box(
                        modifier = Modifier
                            .size(pixelSize)
                            .background(color ?: Color.Transparent)
                    )
                }
            }
        }
    }
}
