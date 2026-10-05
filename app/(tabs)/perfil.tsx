import { useAuth, useUser } from "@clerk/expo";
import { Link } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { apiFetch } from "@/lib/api";
import { getCached, setCached } from "@/lib/cache";
import { CREDIT_PLANS } from "@/lib/credits-pricing";
import { whatsappUrl } from "@/lib/whatsapp";

const CACHE_KEY = "perfil";

type CreditsResponse = { credits: number; vencimiento: string | null; perfilCompleto: boolean };
type PlanInfo = { id: string; name?: string; label: string; price: number };
type PlanResponse =
  | { hasSubscription: false }
  | {
      hasSubscription: true;
      estado: string;
      plan: PlanInfo | null;
      proximoCobro: string | null;
      planSiguiente: PlanInfo | null;
    };
type CodigoReferidoResponse = { codigo: string | null; esInfluencer: boolean; creditosPorReferido: number };
type ScreenState = {
  loading: boolean;
  error: string | null;
  credits: CreditsResponse | null;
  plan: PlanResponse | null;
  codigoReferido: CodigoReferidoResponse | null;
};

function GuestView() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu cuenta</Text>
      <Text style={styles.guestText}>
        Puedes explorar los gimnasios sin cuenta. Para reservar clases y comprar créditos,
        necesitas iniciar sesión o crear una cuenta.
      </Text>

      <Link href="/sign-in" asChild>
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </Pressable>
      </Link>

      <Link href="/sign-up" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Crear cuenta</Text>
        </Pressable>
      </Link>

      <Pressable style={styles.whatsappButton} onPress={() => Linking.openURL(whatsappUrl())}>
        <Text style={styles.whatsappButtonText}>¿Dudas? Escríbenos por WhatsApp</Text>
      </Pressable>
    </View>
  );
}

function SignedInView() {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const cached = getCached<{
    credits: CreditsResponse;
    plan: PlanResponse;
    codigoReferido?: CodigoReferidoResponse;
  }>(CACHE_KEY);
  const [state, setState] = useState<ScreenState>({
    loading: !cached,
    error: null,
    credits: cached?.credits ?? null,
    plan: cached?.plan ?? null,
    codigoReferido: cached?.codigoReferido ?? null,
  });

  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState(false);
  const [changePlanError, setChangePlanError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const token = await getToken();
      const [credits, plan, codigoReferido] = await Promise.all([
        apiFetch<CreditsResponse>("/me/credits", token),
        apiFetch<PlanResponse>("/me/plan", token),
        apiFetch<CodigoReferidoResponse>("/me/codigo-referido", token).catch(() => null),
      ]);
      setCached(CACHE_KEY, { credits, plan, codigoReferido });
      setState({ loading: false, error: null, credits, plan, codigoReferido });
    } catch {
      setState((prev) =>
        prev.credits
          ? { ...prev, loading: false }
          : {
              loading: false,
              error: "No pudimos cargar tu cuenta.",
              credits: null,
              plan: null,
              codigoReferido: null,
            }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function confirmCancelPlan() {
    Alert.alert(
      "Cancelar plan",
      "¿Seguro que quieres cancelar tu plan? Dejarás de renovar créditos cada mes.",
      [
        { text: "No", style: "cancel" },
        { text: "Sí, cancelar", style: "destructive", onPress: cancelPlan },
      ]
    );
  }

  async function cancelPlan() {
    setCancelling(true);
    setCancelError(null);
    try {
      const token = await getToken();
      await apiFetch("/suscripcion/cancelar", token, { method: "POST" });
      await load();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : "No pudimos cancelar tu plan.");
    } finally {
      setCancelling(false);
    }
  }

  function confirmDeleteAccount() {
    Alert.alert(
      "Eliminar cuenta",
      "Esto borra tu perfil, créditos y tu acceso de forma permanente. No se puede deshacer. ¿Seguro que quieres continuar?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, eliminar mi cuenta",
          style: "destructive",
          onPress: () =>
            Alert.alert(
              "¿Estás completamente segura?",
              "Vas a perder el acceso a tu cuenta y tus créditos para siempre.",
              [
                { text: "No", style: "cancel" },
                { text: "Eliminar mi cuenta", style: "destructive", onPress: deleteAccount },
              ]
            ),
        },
      ]
    );
  }

  async function deleteAccount() {
    setDeletingAccount(true);
    setDeleteError(null);
    try {
      const token = await getToken();
      await apiFetch("/me/eliminar-cuenta", token, { method: "POST" });
      await signOut();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "No pudimos eliminar tu cuenta. Intenta de nuevo."
      );
      setDeletingAccount(false);
    }
  }

  function compartirCodigo(codigo: string, esInfluencer: boolean, creditos: number) {
    const mensaje = esInfluencer
      ? `Usa mi código ${codigo} al pagar tu primer plan en UNIQUE y ambos ganamos ${creditos} créditos 🎁`
      : `Usa mi código ${codigo} al pagar tu primer plan en UNIQUE y me gano ${creditos} créditos 🎁`;
    Share.share({ message: mensaje }).catch(() => {});
  }

  function confirmChangePlan(currentPlanId: string | undefined) {
    const opciones = CREDIT_PLANS.filter((p) => p.id !== currentPlanId);
    Alert.alert(
      "Cambiar de plan",
      "El cambio aplica en tu próxima renovación, sin cobros adicionales ahora.",
      [
        ...opciones.map((p) => ({
          text: `${p.name} — ${p.label}`,
          onPress: () => changePlan(p.id),
        })),
        { text: "Cancelar", style: "cancel" as const },
      ]
    );
  }

  async function changePlan(planId: string) {
    setChangingPlan(true);
    setChangePlanError(null);
    try {
      const token = await getToken();
      await apiFetch("/suscripcion/cambiar-plan", token, { method: "POST", body: { planId } });
      await load();
    } catch (err) {
      setChangePlanError(err instanceof Error ? err.message : "No pudimos cambiar tu plan.");
    } finally {
      setChangingPlan(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>

      {state.loading && <ActivityIndicator style={styles.loader} />}
      {state.error && <Text style={styles.error}>{state.error}</Text>}

      {state.credits && (
        <View style={styles.card}>
          <Text style={styles.creditsNumber}>{state.credits.credits}</Text>
          <Text style={styles.creditsLabel}>créditos disponibles</Text>
          {state.credits.vencimiento && (
            <Text style={styles.expiry}>Vencen el {state.credits.vencimiento}</Text>
          )}
        </View>
      )}

      {state.plan && (
        <View style={styles.planCard}>
          <Text style={styles.planLabel}>Mi plan</Text>
          {state.plan.hasSubscription ? (
            <>
              <Text style={styles.planName}>
                {state.plan.plan ? `${state.plan.plan.name ?? ""} — ${state.plan.plan.label}` : "—"}
              </Text>
              <Text style={styles.planMeta}>Estado: {state.plan.estado}</Text>
              {state.plan.proximoCobro && (
                <Text style={styles.planMeta}>Próximo cobro: {state.plan.proximoCobro}</Text>
              )}
              {state.plan.planSiguiente && (
                <Text style={styles.planMeta}>
                  Cambia a {state.plan.planSiguiente.name} ({state.plan.planSiguiente.label}) en la
                  próxima renovación
                </Text>
              )}
              {state.plan.estado === "Activa" && (
                <View style={styles.planButtonsRow}>
                  <Pressable
                    style={styles.changePlanButton}
                    onPress={() => confirmChangePlan(state.plan?.hasSubscription ? state.plan.plan?.id : undefined)}
                    disabled={changingPlan}
                  >
                    {changingPlan ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.changePlanText}>Cambiar plan</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={styles.cancelPlanButton}
                    onPress={confirmCancelPlan}
                    disabled={cancelling}
                  >
                    {cancelling ? (
                      <ActivityIndicator color="#ff4f3f" size="small" />
                    ) : (
                      <Text style={styles.cancelPlanText}>Cancelar plan</Text>
                    )}
                  </Pressable>
                </View>
              )}
              {changePlanError && <Text style={styles.cancelPlanError}>{changePlanError}</Text>}
              {cancelError && <Text style={styles.cancelPlanError}>{cancelError}</Text>}
            </>
          ) : (
            <Text style={styles.planMeta}>Todavía no tienes un plan activo.</Text>
          )}
        </View>
      )}

      {state.codigoReferido?.codigo && (
        <View style={styles.referralCard}>
          <Text style={styles.referralTitle}>Refiere y gana créditos 🎁</Text>
          <Text style={styles.referralBody}>
            {state.codigoReferido.esInfluencer
              ? `Comparte tu código — cuando alguien pague su primer plan con él, ambos ganan ${state.codigoReferido.creditosPorReferido} créditos.`
              : `Comparte tu código — cuando un amigo pague su primer plan, te llegan ${state.codigoReferido.creditosPorReferido} créditos (necesitas tener un plan activo en ese momento).`}
          </Text>
          <Text style={styles.referralCode}>{state.codigoReferido.codigo}</Text>
          <Pressable
            style={styles.referralShareButton}
            onPress={() =>
              compartirCodigo(
                state.codigoReferido!.codigo!,
                state.codigoReferido!.esInfluencer,
                state.codigoReferido!.creditosPorReferido
              )
            }
          >
            <Text style={styles.referralShareText}>Compartir código</Text>
          </Pressable>
        </View>
      )}

      <Link href="/(tabs)/reservas" asChild>
        <Pressable style={styles.editProfileButton}>
          <Text style={styles.editProfileText}>Ver mis reservas</Text>
        </Pressable>
      </Link>

      <Link href="/completar-perfil" asChild>
        <Pressable style={styles.editProfileButton}>
          <Text style={styles.editProfileText}>Editar información personal</Text>
        </Pressable>
      </Link>

      <Pressable style={styles.whatsappButton} onPress={() => Linking.openURL(whatsappUrl())}>
        <Text style={styles.whatsappButtonText}>¿Dudas? Escríbenos por WhatsApp</Text>
      </Pressable>

      <Pressable style={styles.signOutButton} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Cerrar sesión</Text>
      </Pressable>

      <Pressable
        style={styles.deleteAccountButton}
        onPress={confirmDeleteAccount}
        disabled={deletingAccount}
      >
        {deletingAccount ? (
          <ActivityIndicator color="#ff4f3f" size="small" />
        ) : (
          <Text style={styles.deleteAccountText}>Eliminar cuenta</Text>
        )}
      </Pressable>
      {deleteError && <Text style={styles.cancelPlanError}>{deleteError}</Text>}
    </View>
  );
}

export default function PerfilScreen() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return isSignedIn ? <SignedInView /> : <GuestView />;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#063009",
    marginBottom: 12,
  },
  guestText: {
    fontSize: 15,
    color: "#06300999",
    lineHeight: 22,
    marginBottom: 24,
  },
  email: { fontSize: 14, color: "#06300999", textAlign: "center", marginBottom: 16 },
  loader: { marginTop: 24 },
  error: { color: "#ff4f3f", fontSize: 14, textAlign: "center", marginTop: 16 },
  card: {
    marginTop: 24,
    borderRadius: 20,
    backgroundColor: "#063009",
    paddingVertical: 32,
    alignItems: "center",
  },
  creditsNumber: { fontSize: 48, fontWeight: "800", color: "#fff" },
  creditsLabel: { fontSize: 14, color: "#ffffffb3", marginTop: 4 },
  expiry: { fontSize: 13, color: "#ffffff80", marginTop: 12 },
  planCard: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#063009",
    padding: 20,
  },
  planLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ff4f3f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  planName: { fontSize: 17, fontWeight: "700", color: "#fff" },
  planMeta: { fontSize: 13, color: "#ffffffb3", marginTop: 4 },
  planButtonsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  changePlanButton: {
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  changePlanText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  cancelPlanButton: {
    borderWidth: 1,
    borderColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  cancelPlanText: { color: "#ff4f3f", fontSize: 13, fontWeight: "700" },
  cancelPlanError: { color: "#ff4f3f", fontSize: 12, marginTop: 8 },
  referralCard: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ff4f3f4d",
    backgroundColor: "#ff4f3f0d",
    padding: 20,
  },
  referralTitle: { fontSize: 15, fontWeight: "700", color: "#063009" },
  referralBody: { fontSize: 12.5, color: "#06300999", marginTop: 6, lineHeight: 18 },
  referralCode: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#ff4f3f",
  },
  referralShareButton: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  referralShareText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  button: {
    backgroundColor: "#ff4f3f",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#06300933",
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#063009", fontSize: 16, fontWeight: "700" },
  editProfileButton: {
    marginTop: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#06300933",
    paddingVertical: 14,
    alignItems: "center",
  },
  editProfileText: { color: "#063009", fontSize: 15, fontWeight: "700" },
  whatsappButton: {
    marginTop: 12,
    borderRadius: 999,
    backgroundColor: "#25D366",
    paddingVertical: 14,
    alignItems: "center",
  },
  whatsappButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  signOutButton: {
    marginTop: "auto",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ff4f3f",
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutText: { color: "#ff4f3f", fontSize: 15, fontWeight: "700" },
  deleteAccountButton: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 10,
  },
  deleteAccountText: { color: "#ff4f3f99", fontSize: 13, fontWeight: "600" },
});
