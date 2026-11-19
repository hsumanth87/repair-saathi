package com.repairsaathi.data.model

enum class RepairStage(val label: String) {
    REQUEST_SUBMITTED("Request Submitted"),
    TECHNICIAN_ASSIGNED("Technician Assigned"),
    INSPECTION_STARTED("Inspection Started"),
    QUOTATION_SUBMITTED("Quotation Submitted"),
    CUSTOMER_APPROVED("Customer Approved"),
    REPAIR_IN_PROGRESS("Repair In Progress"),
    REPAIR_COMPLETED("Repair Completed"),
    DELIVERED("Delivered")
}

data class DiagnosisRequest(
    val deviceId: String,
    val deviceLabel: String,
    val category: String,
    val symptomDescription: String,
    val imageBase64: String? = null,
    val imageMimeType: String? = "image/jpeg"
)

data class DiagnosisCause(
    val cause: String,
    val likelihood: String,
    val explanation: String
)

data class DiagnosisResult(
    val id: String,
    val preliminaryFault: String,
    val severity: String,
    val probableCauses: List<DiagnosisCause>,
    val safeTroubleshootingSteps: List<String>,
    val requiresProfessional: Boolean,
    val estimatedPartsCostMin: Int,
    val estimatedPartsCostMax: Int,
    val estimatedLabourCostMin: Int,
    val estimatedLabourCostMax: Int,
    val disclaimer: String
)

data class TechnicianSummary(
    val id: String,
    val name: String,
    val workshopName: String,
    val area: String,
    val rating: Double,
    val reviewCount: Int,
    val inspectionFeeInr: Int,
    val verified: Boolean,
    val lat: Double,
    val lng: Double
)

data class BookingResponse(
    val id: String,
    val deviceLabel: String,
    val technicianName: String,
    val status: String,
    val scheduledDate: String,
    val scheduledSlot: String
)
