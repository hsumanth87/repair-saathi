package com.repairsaathi.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.repairsaathi.data.model.DiagnosisRequest
import com.repairsaathi.data.model.DiagnosisResult
import com.repairsaathi.data.remote.RepairSaathiApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface DiagnosisUiState {
    data object Idle : DiagnosisUiState
    data object Loading : DiagnosisUiState
    data class Success(val result: DiagnosisResult) : DiagnosisUiState
    data class Error(val message: String) : DiagnosisUiState
}

class DiagnosisViewModel(private val api: RepairSaathiApi) : ViewModel() {
    private val _uiState = MutableStateFlow<DiagnosisUiState>(DiagnosisUiState.Idle)
    val uiState: StateFlow<DiagnosisUiState> = _uiState.asStateFlow()

    fun analyzeDevice(bearerToken: String, request: DiagnosisRequest) {
        if (request.symptomDescription.trim().length < 8) {
            _uiState.value = DiagnosisUiState.Error("Please describe symptoms (min 8 characters).")
            return
        }
        viewModelScope.launch {
            _uiState.value = DiagnosisUiState.Loading
            try {
                val res = api.runDiagnosis("Bearer $bearerToken", request)
                _uiState.value = DiagnosisUiState.Success(res.diagnosis)
            } catch (e: Exception) {
                _uiState.value = DiagnosisUiState.Error(
                    e.message ?: "Unable to complete AI diagnosis. Check connectivity."
                )
            }
        }
    }
}
