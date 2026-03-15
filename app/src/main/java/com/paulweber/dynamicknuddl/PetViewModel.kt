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
                currentFrame = (currentFrame + 1) % frames.size
                delay(400) // Constants.animationFrameDuration
            }
        }
    }

    private fun startRandomBehavior() {
        viewModelScope.launch {
            while (true) {
                delay(Random.nextLong(8000, 20000))
                if (currentState == PetState.IDLE) {
                    playRandomAnimation()
                }
            }
        }
    }

    private suspend fun playRandomAnimation() {
        val randomState = PetState.randomAnimations.random()
        currentState = randomState
        currentFrame = 0
        
        val duration = when (randomState) {
            PetState.TURNING -> 2000L
            PetState.PECKING -> 3000L
            PetState.STRETCHING -> 2500L
            PetState.SLEEPING -> 4000L
            else -> 2000L
        }
        
        delay(duration)
        currentState = PetState.IDLE
        currentFrame = 0
    }

    fun feed() {
        isMenuVisible = false
        viewModelScope.launch {
            currentState = PetState.EATING
            currentFrame = 0
            delay(4000)
            currentState = PetState.IDLE
        }
    }

    fun play() {
        isMenuVisible = false
        viewModelScope.launch {
            currentState = PetState.PLAYING
            currentFrame = 0
            delay(5000)
            currentState = PetState.IDLE
        }
    }

    fun toggleMenu() {
        isMenuVisible = !isMenuVisible
    }
}
