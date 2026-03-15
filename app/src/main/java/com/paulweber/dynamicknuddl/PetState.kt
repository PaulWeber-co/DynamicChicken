package com.paulweber.dynamicknuddl

enum class PetState {
    IDLE, EATING, SLEEPING, PLAYING, TURNING, PECKING, STRETCHING, FISHING, WALKING;

    companion object {
        val randomAnimations = listOf(TURNING, PECKING, STRETCHING, SLEEPING, FISHING, WALKING)
    }
}
