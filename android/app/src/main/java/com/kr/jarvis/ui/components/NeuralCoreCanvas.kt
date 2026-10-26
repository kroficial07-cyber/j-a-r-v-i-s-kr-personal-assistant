package com.kr.jarvis.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import com.kr.jarvis.viewmodel.AssistantState
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.sin

@Composable
fun NeuralCoreCanvas(
    state: AssistantState,
    audioLevel: Float,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    lowPowerMode: Boolean = false
) {
    val infiniteTransition = rememberInfiniteTransition(label = "neural_core")

    val duration = when (state) {
        AssistantState.LISTENING -> 2500
        AssistantState.PROCESSING -> 1500
        AssistantState.SPEAKING -> 3500
        AssistantState.IDLE -> 7000
    }

    val rotation by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = if (lowPowerMode) duration * 2 else duration, easing = LinearEasing)
        ),
        label = "rotation"
    )

    val pulse by infiniteTransition.animateFloat(
        initialValue = 0.90f,
        targetValue = 1.10f,
        animationSpec = infiniteRepeatable(
            animation = tween(if (state == AssistantState.LISTENING) 600 else 1400, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse"
    )

    val interactionSource = remember { MutableInteractionSource() }

    Canvas(
        modifier = modifier.clickable(
            interactionSource = interactionSource,
            indication = null,
            onClick = onClick
        )
    ) {
        val center = Offset(size.width / 2, size.height / 2)
        val radius = size.minDimension * 0.38f
        val dynamicPulse = if (state == AssistantState.LISTENING) pulse + audioLevel * 0.25f else pulse

        val primaryColor = when (state) {
            AssistantState.LISTENING -> Color(0xFF22D3EE)
            AssistantState.PROCESSING -> Color(0xFF38BDF8)
            AssistantState.SPEAKING -> Color(0xFF06B6D4)
            AssistantState.IDLE -> Color(0xFF06B6D4)
        }

        // 1. Ambient Glow
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(primaryColor.copy(alpha = 0.35f), Color.Transparent),
                center = center,
                radius = radius * 1.5f * dynamicPulse
            ),
            radius = radius * 1.4f * dynamicPulse,
            center = center
        )

        // 2. Outer Segmented Ring
        rotate(rotation * 0.6f, pivot = center) {
            drawCircle(
                color = primaryColor.copy(alpha = 0.4f),
                radius = radius * 0.95f,
                center = center,
                style = Stroke(
                    width = 2.5f,
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(15f, 20f, 40f, 20f), 0f)
                )
            )
        }

        // 3. Counter-rotating Intermediate Ring with Tick Satellites
        rotate(-rotation * 1.2f, pivot = center) {
            drawCircle(
                color = Color(0xFF3B82F6).copy(alpha = 0.5f),
                radius = radius * 0.72f,
                center = center,
                style = Stroke(width = 3.5f)
            )

            val tickCount = 12
            for (i in 0 until tickCount) {
                val theta = (i * 2 * PI / tickCount).toFloat()
                val x1 = center.x + cos(theta) * (radius * 0.68f)
                val y1 = center.y + sin(theta) * (radius * 0.68f)
                val x2 = center.x + cos(theta) * (radius * 0.76f)
                val y2 = center.y + sin(theta) * (radius * 0.76f)
                drawLine(
                    color = primaryColor,
                    start = Offset(x1, y1),
                    end = Offset(x2, y2),
                    strokeWidth = 2f
                )
            }
        }

        // 4. Waveform Audio Spikes if Listening or Speaking
        if (state == AssistantState.LISTENING || state == AssistantState.SPEAKING) {
            val spikeCount = 32
            for (i in 0 until spikeCount) {
                val theta = (i * 2 * PI / spikeCount).toFloat()
                val amp = if (state == AssistantState.LISTENING) {
                    (sin(i * 0.8f + rotation * 0.05f) * 15f + audioLevel * 30f + 6f)
                } else {
                    (sin(i * 1.2f + rotation * 0.1f) * 12f + 8f)
                }
                val rBase = radius * 0.46f
                val startX = center.x + cos(theta) * rBase
                val startY = center.y + sin(theta) * rBase
                val endX = center.x + cos(theta) * (rBase + amp)
                val endY = center.y + sin(theta) * (rBase + amp)

                drawLine(
                    color = primaryColor.copy(alpha = 0.85f),
                    start = Offset(startX, startY),
                    end = Offset(endX, endY),
                    strokeWidth = 3f
                )
            }
        }

        // 5. Central Glowing Core
        drawCircle(
            brush = Brush.radialGradient(
                colors = listOf(Color.White, primaryColor, Color(0xFF0F172A)),
                center = center,
                radius = radius * 0.40f * dynamicPulse
            ),
            radius = radius * 0.40f * dynamicPulse,
            center = center
        )

        // 6. White Arc Reactor Center Eye
        drawCircle(
            color = Color.White,
            radius = radius * 0.14f,
            center = center
        )
    }
}
