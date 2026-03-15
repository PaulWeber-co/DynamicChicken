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

    val eating1 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,K,K,K,K,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,B,B,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,K,K,K,K,Y,Y,Y,B,X,X),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X)
    )

    val eating2 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,B,B,Y,Y,Y,Y,B,B,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X)
    )

    val sleeping1 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,B,B,B,Y,Y,B,B,B,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,X,B,D,Y,Y,Y,Y,Y,Y,D,B,X,X,X),
        listOf(X,X,X,B,D,Y,W,W,W,W,Y,D,B,X,X,X),
        listOf(X,X,X,B,Y,W,W,W,W,W,W,Y,B,X,X,X),
        listOf(X,X,X,X,B,B,Y,Y,Y,Y,B,B,X,X,X,X),
        listOf(X,X,X,X,X,B,B,B,B,B,B,X,X,X,X,X)
    )

    val sleeping2 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,B,B,Y,Y,B,B,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,X,B,D,Y,Y,Y,Y,Y,Y,D,B,X,X,X),
        listOf(X,X,X,B,D,Y,W,W,W,W,Y,D,B,X,X,X),
        listOf(X,X,X,B,Y,W,W,W,W,W,W,Y,B,X,X,X),
        listOf(X,X,X,X,B,B,Y,Y,Y,Y,B,B,X,X,X,X),
        listOf(X,X,X,X,X,B,B,B,B,B,B,X,X,X,X,X)
    )

    val playing1 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,B,D,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(B,D,B,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,B,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X)
    )

    val playing2 = listOf(
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,K,K,Y,Y,Y,Y,D,B,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,B,D,B),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,B,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X)
    )

    val pecking1 = listOf(
        listOf(X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X),
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,X,X,B,X,B,X,B,X,X,X,X,X),
        listOf(X,X,X,X,B,B,R,B,R,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,E,Y,Y,Y,Y,E,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,K,K,K,K,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,Y,K,K,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X)
    )

    val pecking2 = listOf(
        listOf(X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X),
        listOf(X,X,X,X,X,X,X,X,X,X,X,X,X,X,X,X),
        listOf(X,X,X,X,X,X,H,X,H,X,H,X,X,X,X,X),
        listOf(X,X,X,X,B,B,B,B,B,B,B,B,X,X,X,X),
        listOf(X,X,X,B,Y,Y,R,Y,R,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,Y,Y,E,Y,Y,Y,E,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,B,Y,Y,Y,Y,Y,Y,Y,Y,Y,Y,B,X,X),
        listOf(X,X,X,B,Y,Y,K,K,K,Y,Y,Y,B,X,X,X),
        listOf(X,X,B,D,Y,Y,Y,Y,Y,Y,Y,Y,D,B,X,X),
        listOf(X,X,B,D,Y,Y,W,W,W,W,Y,Y,D,B,X,X),
        listOf(X,X,B,Y,Y,W,W,W,W,W,W,Y,Y,B,X,X),
        listOf(X,X,X,B,B,Y,Y,Y,Y,Y,Y,B,B,X,X,X),
        listOf(X,X,X,B,K,B,X,X,X,X,B,K,B,X,X,X)
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
            PetState.EATING -> listOf(eating1, eating2)
            PetState.SLEEPING -> listOf(sleeping1, sleeping2)
            PetState.PLAYING -> listOf(playing1, playing2)
            PetState.PECKING -> listOf(pecking1, pecking2)
            else -> listOf(idle1, idle2)
        }
    }
}
