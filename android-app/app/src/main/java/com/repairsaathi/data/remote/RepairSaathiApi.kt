package com.repairsaathi.data.remote

import com.repairsaathi.data.model.BookingResponse
import com.repairsaathi.data.model.DiagnosisRequest
import com.repairsaathi.data.model.DiagnosisResult
import com.repairsaathi.data.model.TechnicianSummary
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Query

data class DiagnosisEnvelope(val diagnosis: DiagnosisResult)
data class TechniciansEnvelope(val technicians: List<TechnicianSummary>)
data class BookingsEnvelope(val bookings: List<BookingResponse>)

interface RepairSaathiApi {
    @POST("api/diagnose")
    suspend fun runDiagnosis(
        @Header("Authorization") bearerToken: String,
        @Body request: DiagnosisRequest
    ): DiagnosisEnvelope

    @GET("api/technicians")
    suspend fun getNearbyTechnicians(
        @Query("category") category: String = "All",
        @Query("maxDistanceKm") maxDistanceKm: Int = 15,
        @Query("lat") lat: Double,
        @Query("lng") lng: Double
    ): TechniciansEnvelope

    @GET("api/bookings")
    suspend fun getBookings(
        @Header("Authorization") bearerToken: String
    ): BookingsEnvelope
}
