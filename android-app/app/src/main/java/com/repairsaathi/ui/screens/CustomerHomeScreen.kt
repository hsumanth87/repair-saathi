package com.repairsaathi.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Build
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.VerifiedUser
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerHomeScreen(
    customerName: String,
    activeRepairsCount: Int,
    onStartDiagnosis: () -> Unit,
    onFindTechnicians: () -> Unit,
    onOpenTracking: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("RepairSaathi", fontWeight = FontWeight.Bold) })
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                Card(
                    shape = RoundedCornerShape(20.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondary
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(20.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Text(
                            text = "Welcome back, $customerName",
                            style = MaterialTheme.typography.labelLarge,
                            color = MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = "Repair Smart. Save Money. Reduce Waste.",
                            style = MaterialTheme.typography.headlineSmall,
                            fontWeight = FontWeight.Bold
                        )
                        Button(onClick = onStartDiagnosis) {
                            Icon(Icons.Default.Build, contentDescription = null)
                            Spacer(Modifier.width(8.dp))
                            Text("Start AI Diagnosis")
                        }
                    }
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedCard(
                        onClick = onFindTechnicians,
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Icon(Icons.Default.LocationOn, contentDescription = null)
                            Spacer(Modifier.height(8.dp))
                            Text("Nearby Techs", fontWeight = FontWeight.SemiBold)
                        }
                    }
                    OutlinedCard(
                        onClick = onOpenTracking,
                        modifier = Modifier.weight(1f)
                    ) {
                        Column(Modifier.padding(16.dp)) {
                            Icon(Icons.Default.VerifiedUser, contentDescription = null)
                            Spacer(Modifier.height(8.dp))
                            Text("Active ($activeRepairsCount)", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        }
    }
}
