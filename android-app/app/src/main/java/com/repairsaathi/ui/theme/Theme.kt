package com.repairsaathi.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val NavyDeep = Color(0xFF0B132B)
val NavySurface = Color(0xFF0F172A)
val EmeraldPrimary = Color(0xFF059669)
val EmeraldLight = Color(0xFF10B981)
val SlateBg = Color(0xFFF8FAFC)

private val LightColors = lightColorScheme(
    primary = EmeraldPrimary,
    onPrimary = Color.White,
    secondary = NavyDeep,
    onSecondary = Color.White,
    background = SlateBg,
    surface = Color.White,
    onBackground = NavySurface,
    onSurface = NavySurface
)

private val DarkColors = darkColorScheme(
    primary = EmeraldLight,
    onPrimary = NavyDeep,
    secondary = Color(0xFF1E293B),
    onSecondary = Color.White,
    background = Color(0xFF020617),
    surface = NavySurface,
    onBackground = Color(0xFFF1F5F9),
    onSurface = Color(0xFFF1F5F9)
)

@Composable
fun RepairSaathiTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = if (darkTheme) DarkColors else LightColors,
        content = content
    )
}
