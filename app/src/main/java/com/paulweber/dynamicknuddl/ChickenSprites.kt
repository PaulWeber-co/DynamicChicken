package com.paulweber.dynamicknuddl

import androidx.compose.ui.graphics.Color

object ChickenSprites {
    // Color aliases
    private val Y = Color(0xFFFFD700) // Bright yellow
    private val D = Color(0xFFD9AD00) // Dark yellow shading
    private val W = Color(0xFFFFF7D9) // Creamy white belly
    private val K = Color(0xFFFF8C1A) // Orange beak
    private val R = Color(0xFFE62626) // Red comb
    private val E = Color.Black       // Eyes
    private val B = Color.Black       // Outlines
    private val H = Color.Black       // Hair strands
    private val X: Color? = null      // Transparent
    private val S = Color(0xFF8B4513) // Brown (Fishing Rod)
    private val F = Color(0xFF00BFFF) // Blue (Fish)

    val idle1 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X)
    )

    val idle2 = listOf(
        listOf(X,X,X,X,X,X,X,H,X,H,X,H,X,X,X,X),
        listOf(X,X,X,X,X,X,X,B,X,B,X,B,X,X,X,X),
        listOf(X,X,X,X,B,B,B,R,B,R,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,E,Y,Y,E,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,X,B,K,B,X,X,B,K,B,X,X,X,X)
    )

    // Fishing 1: Casting the rod
    val fishing1 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,S),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,S,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,S,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,S,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X)
    )

    // Fishing 2: Rod down, waiting
    val fishing2 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,S,S),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X)
    )

    // Walking 1 (left leg up)
    val walking1 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,X,B,K,X,X,X,X,B,K,B,X,X,X)
    )

    // Walking 2 (right leg up)
    val walking2 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,B,K,B,X,X,X,X,B,K,X,X,X,X)
    )

    // A tiny pixel fish
    val tinyFish = listOf(
        listOf(X,F,F,X),
        listOf(F,F,F,F),
        listOf(X,F,F,X)
    )

    val corn = listOf(
        listOf(X,X,B,B,X,X),
        listOf(X,B,Color(0xFFFFD900),Color(0xFFFFD900),B,X),
        listOf(X,B,Color(0xFFFFD900),Color(0xFFFFD900),B,X),
        listOf(B,Color(0xFFFFD900),Color(0xFFFFD900),Color(0xFFFFD900),Color(0xFFFFD900),B),
        listOf(B,Color(0xFFFFD900),Color(0xFFFFD900),Color(0xFFFFD900),Color(0xFFFFD900),B),
        listOf(B,Color(0xFFFFD900),Color(0xFFFFD900),Color(0xFFFFD900),Color(0xFFFFD900),B),
        listOf(X,B,Color(0xFF66B333),Color(0xFF66B333),B,X),
        listOf(X,X,B,B,X,X)
    )

    fun getFrames(state: PetState): List<List<List<Color?>>> {
        return when (state) {
            PetState.IDLE -> listOf(idle1, idle2)
            PetState.EATING -> listOf(idle1, idle2) // Use idle while eating, handled by overlay logic
            PetState.SLEEPING -> listOf(idle1, idle2) // Handled by sleeping state (simplified for now)
            PetState.FISHING -> listOf(fishing1, fishing2, fishing2, fishing1)
            PetState.WALKING -> listOf(walking1, walking2)
            else -> listOf(idle1, idle2)
        }
    }
}
