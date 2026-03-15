package com.paulweber.dynamicknuddl

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.random.Random

class PetViewModel : ViewModel() {
    var currentState by mutableStateOf(PetState.IDLE)
        private set

    var currentFrame by mutableStateOf(0)
        private set

    var isMenuVisible by mutableStateOf(false)
        private set

    init {
        startAnimationLoop()
        startRandomBehavior()
    }

    private fun startAnimationLoop() {
        viewModelScope.launch {
            while (true) {
                val frames = ChickenSprites.getFrames(currentState)
                if (frames.isNotEmpty()) {
                    currentFrame = (currentFrame + 1) % frames.size
                }
                delay(400)
            }
        }
    }

    private fun startRandomBehavior() {
        viewModelScope.launch {
            while (true) {
                delay(Random.nextLong(15000, 30000))
                if (currentState == PetState.IDLE) {
                    playRandomAnimation()
                }
            }
        }
    }

    private suspend fun playRandomAnimation() {
        val randomState = PetState.randomAnimations.random()
        triggerAnimation(randomState)
    }

    private suspend fun triggerAnimation(state: PetState) {
        currentState = state
        currentFrame = 0
        
        val duration = when (state) {
            PetState.TURNING -> 2000L
            PetState.PECKING -> 3000L
            PetState.STRETCHING -> 2500L
            PetState.SLEEPING -> 5000L
            PetState.FISHING -> 8000L
            PetState.WALKING -> 6000L
            else -> 2000L
        }
        
        delay(duration)
        currentState = PetState.IDLE
        currentFrame = 0
    }

    fun feed() {
        viewModelScope.launch { triggerAnimation(PetState.EATING) }
    }

    fun play() {
        viewModelScope.launch { triggerAnimation(PetState.PLAYING) }
    }

    fun fish() {
        viewModelScope.launch { triggerAnimation(PetState.FISHING) }
    }

    fun walk() {
        viewModelScope.launch { triggerAnimation(PetState.WALKING) }
    }

    fun toggleMenu() {
        isMenuVisible = !isMenuVisible
    }
}
