package com.repairsaathi.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable

object Routes {
    const val SPLASH = "splash"
    const val ONBOARDING = "onboarding"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val ROLE_SELECT = "role_select"
    const val CUSTOMER_HOME = "customer_home"
    const val AI_DIAGNOSIS = "ai_diagnosis"
    const val IMAGE_UPLOAD = "image_upload"
    const val DIAGNOSIS_RESULTS = "diagnosis_results"
    const val NEARBY_TECHS = "nearby_techs"
    const val TECH_PROFILE = "tech_profile/{techId}"
    const val QUOTATIONS = "quotations/{bookingId}"
    const val BOOKING = "booking"
    const val TRACKING = "tracking/{bookingId}"
    const val PAYMENT = "payment/{bookingId}"
    const val HISTORY = "history"
    const val WARRANTY = "warranty"
    const val RECYCLING = "recycling"
    const val PROFILE = "profile"
    const val TECH_DASHBOARD = "tech_dashboard"
    const val ADMIN_DASHBOARD = "admin_dashboard"
}

@Composable
fun RepairSaathiNavHost(
    navController: NavHostController,
    startDestination: String = Routes.SPLASH
) {
    NavHost(navController = navController, startDestination = startDestination) {
        composable(Routes.SPLASH) { /* SplashScreen */ }
        composable(Routes.ONBOARDING) { /* OnboardingScreen */ }
        composable(Routes.LOGIN) { /* LoginScreen */ }
        composable(Routes.REGISTER) { /* RegisterScreen */ }
        composable(Routes.ROLE_SELECT) { /* RoleSelectionScreen */ }
        composable(Routes.CUSTOMER_HOME) { /* CustomerHomeScreen */ }
        composable(Routes.AI_DIAGNOSIS) { /* AIDiagnosisScreen */ }
        composable(Routes.IMAGE_UPLOAD) { /* ImageUploadScreen */ }
        composable(Routes.DIAGNOSIS_RESULTS) { /* DiagnosisResultsScreen */ }
        composable(Routes.NEARBY_TECHS) { /* NearbyTechniciansScreen */ }
        composable(Routes.TECH_PROFILE) { /* TechnicianProfileScreen */ }
        composable(Routes.QUOTATIONS) { /* RepairQuotationScreen */ }
        composable(Routes.BOOKING) { /* BookingScreen */ }
        composable(Routes.TRACKING) { /* RepairTrackingScreen */ }
        composable(Routes.PAYMENT) { /* PaymentScreen */ }
        composable(Routes.HISTORY) { /* RepairHistoryScreen */ }
        composable(Routes.WARRANTY) { /* DigitalWarrantyScreen */ }
        composable(Routes.RECYCLING) { /* RecyclingScreen */ }
        composable(Routes.PROFILE) { /* UserProfileScreen */ }
        composable(Routes.TECH_DASHBOARD) { /* TechnicianDashboardScreen */ }
        composable(Routes.ADMIN_DASHBOARD) { /* AdminDashboardScreen */ }
    }
}
