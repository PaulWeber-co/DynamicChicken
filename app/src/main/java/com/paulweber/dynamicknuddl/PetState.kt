package com.paulweber.dynamicknuddl

enum class PetState {
    IDLE, EATING, SLEEPING, PLAYING, TURNING, PECKING, STRETCHING;

    companion object {
        val randomAnimations = listOf(TURNING, PECKING, STRETCHING, SLEEPING)
    }
}
