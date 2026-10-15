import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

export default function CardsScreen() {
  const {
    theme,
    formatMoney,
    cardSettings,
    cardSummary,
    openCardModal,
    openAddTransaction,
    openEditTransaction,
    requestDelete,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('installments'); // 'installments' | 'invoice' | 'subscriptions'

  const {
    currentInvoiceAmount,
    futureDebtRemaining,
    totalCommitted,
    availableLimit,
    cardLimit,
    limitUsedPct,
    activeInstallments,
    subscriptions,
  } = cardSummary;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* CARTÃO VIRTUAL VISUAL ZEN */}
      <View
        style={[
          styles.creditCardBox,
          {
            backgroundColor: cardSettings?.color || '#6366F1',
            shadowColor: cardSettings?.color || '#6366F1',
          },
        ]}
      >
        {/* Topo do Cartão: Nome + Chip + Botão Ajustar */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardBrandRow}>
            <View style={styles.chipSim} />
            <Feather name="wifi" size={16} color="rgba(255,255,255,0.7)" style={{ transform: [{ rotate: '90deg' }] }} />
          </View>
          <TouchableOpacity
            onPress={openCardModal}
            style={styles.cardConfigBtn}
            activeOpacity={0.8}
          >
            <Feather name="sliders" size={14} color="#FFF" />
            <Text style={styles.cardConfigBtnText}>Ajustar</Text>
          </TouchableOpacity>
        </View>

        {/* Nome do Cartão */}
        <Text style={styles.cardNameText}>{cardSettings?.name || 'Meu Cartão'}</Text>

        {/* Fatura Atual em Destaque */}
        <View style={styles.invoiceHighlight}>
          <Text style={styles.invoiceLabel}>FATURA DO MÊS ATUAL</Text>
          <Text style={styles.invoiceValue}>{formatMoney(currentInvoiceAmount)}</Text>
          <View style={styles.invoiceDatesPill}>
            <Feather name="calendar" size={11} color="rgba(255,255,255,0.85)" />
            <Text style={styles.invoiceDatesText}>
              Fecha dia {cardSettings?.closingDay || 10} • Vence dia {cardSettings?.dueDay || 17}
            </Text>
          </View>
        </View>

        {/* Barra de Limite */}
        <View style={styles.cardLimitSection}>
          <View style={styles.limitInfoRow}>
            <Text style={styles.limitLabel}>Limite Disponível: {formatMoney(availableLimit)}</Text>
            <Text style={styles.limitTotal}>Total: {formatMoney(cardLimit)}</Text>
          </View>
          <View style={styles.limitTrack}>
            <View style={[styles.limitFill, { width: `${limitUsedPct}%` }]} />
          </View>
        </View>
      </View>

      {/* MÉTRICAS DE DÍVIDAS & PARCELAMENTOS */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconBox, { backgroundColor: theme.red + '20' }]}>
              <Feather name="alert-circle" size={14} color={theme.red} />
            </View>
            <Text style={[styles.metricTitle, { color: theme.textSub }]}>Dívida Restante</Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.red }]}>
            {formatMoney(futureDebtRemaining)}
          </Text>
          <Text style={[styles.metricSub, { color: theme.textSub }]}>
            Parcelas futuras a pagar
          </Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.metricHeader}>
            <View style={[styles.metricIconBox, { backgroundColor: theme.indigo + '20' }]}>
              <Feather name="layers" size={14} color={theme.indigo} />
            </View>
            <Text style={[styles.metricTitle, { color: theme.textSub }]}>Parcelas Ativas</Text>
          </View>
          <Text style={[styles.metricValue, { color: theme.textMain }]}>
            {activeInstallments.length} {activeInstallments.length === 1 ? 'compra' : 'compras'}
          </Text>
          <Text style={[styles.metricSub, { color: theme.textSub }]}>
            Comprometendo faturas
          </Text>
        </View>
      </View>

      {/* SELETOR DE SUB-ABAS (Parcelas, Fatura, Assinaturas) */}
      <View style={[styles.subTabsRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => setActiveSubTab('installments')}
          style={[styles.subTabBtn, activeSubTab === 'installments' && { backgroundColor: theme.indigo }]}
        >
          <Feather
            name="pie-chart"
            size={13}
            color={activeSubTab === 'installments' ? '#FFF' : theme.textSub}
          />
          <Text
            style={[
              styles.subTabText,
              { color: activeSubTab === 'installments' ? '#FFF' : theme.textSub },
            ]}
          >
            Parcelas ({activeInstallments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveSubTab('subscriptions')}
          style={[styles.subTabBtn, activeSubTab === 'subscriptions' && { backgroundColor: theme.indigo }]}
        >
          <Feather
            name="refresh-cw"
            size={13}
            color={activeSubTab === 'subscriptions' ? '#FFF' : theme.textSub}
          />
          <Text
            style={[
              styles.subTabText,
              { color: activeSubTab === 'subscriptions' ? '#FFF' : theme.textSub },
            ]}
          >
            Assinaturas ({subscriptions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO DA ABA: PARCELAS ATIVAS */}
      {activeSubTab === 'installments' && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
              Compras Parceladas em Andamento
            </Text>
            <TouchableOpacity onPress={openAddTransaction}>
              <Text style={[styles.addBtnLink, { color: theme.indigo }]}>+ Parcelar</Text>
            </TouchableOpacity>
          </View>

          {activeInstallments.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Feather name="check-circle" size={32} color={theme.green} />
              <Text style={[styles.emptyTitle, { color: theme.textMain, marginTop: 10 }]}>
                Nenhuma parcela ativa!
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSub }]}>
                Ao cadastrar compras no Cartão de Crédito com parcelamento, você verá o progresso e o saldo devedor aqui.
              </Text>
            </View>
          ) : (
            activeInstallments.map((item) => (
              <View
                key={item.parentId}
                style={[styles.installmentCard, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={styles.installmentTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.installmentName, { color: theme.textMain }]}>
                      {item.description}
                    </Text>
                    <Text style={[styles.installmentCategory, { color: theme.textSub }]}>
                      {item.category || 'Cartão de Crédito'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.installmentMonthlyAmt, { color: theme.textMain }]}>
                      {formatMoney(item.monthlyAmount)}
                      <Text style={{ fontSize: 11, fontWeight: 'normal', color: theme.textSub }}>/mês</Text>
                    </Text>
                    <Text style={[styles.installmentTotalAmt, { color: theme.textSub }]}>
                      Total: {formatMoney(item.totalPurchaseAmount)}
                    </Text>
                  </View>
                </View>

                {/* Barra de Progresso das Parcelas */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressTextRow}>
                    <Text style={[styles.progressPillText, { color: theme.indigo }]}>
                      {item.paidInstallments} de {item.installmentsCount} parcelas pagas
                    </Text>
                    <Text style={[styles.progressRemainingText, { color: theme.red }]}>
                      Restam {formatMoney(item.remainingAmount)} ({item.remainingInstallments}x)
                    </Text>
                  </View>
                  <View style={[styles.progressBarBg, { backgroundColor: theme.bg }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${item.progressPct}%`, backgroundColor: theme.indigo },
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* CONTEÚDO DA ABA: ASSINATURAS FIXAS */}
      {activeSubTab === 'subscriptions' && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.textMain }]}>
              Assinaturas & Cobranças Mensais
            </Text>
            <TouchableOpacity onPress={openAddTransaction}>
              <Text style={[styles.addBtnLink, { color: theme.indigo }]}>+ Nova Assinatura</Text>
            </TouchableOpacity>
          </View>

          {subscriptions.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Feather name="refresh-cw" size={32} color={theme.indigo} />
              <Text style={[styles.emptyTitle, { color: theme.textMain, marginTop: 10 }]}>
                Nenhuma assinatura registrada
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSub }]}>
                Cobranças fixas de cartão (como Netflix, Spotify, academia) cadastradas como 'Assinatura' aparecem aqui.
              </Text>
            </View>
          ) : (
            subscriptions.map((sub) => (
              <View
                key={sub.id}
                style={[styles.subscriptionItem, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <View style={[styles.subIcon, { backgroundColor: theme.indigo + '20' }]}>
                  <Feather name="refresh-cw" size={16} color={theme.indigo} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.subTitle, { color: theme.textMain }]}>{sub.description}</Text>
                  <Text style={[styles.subMeta, { color: theme.textSub }]}>
                    Todo mês na fatura • {sub.category || 'Geral'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.subPrice, { color: theme.red }]}>{formatMoney(sub.amount)}</Text>
                  <TouchableOpacity onPress={() => requestDelete(sub)}>
                    <Feather name="trash-2" size={13} color={theme.red} style={{ marginTop: 4 }} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      <View style={{ height: 90 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 12,
  },
  creditCardBox: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chipSim: {
    width: 34,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardConfigBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.5,
  },
  invoiceHighlight: {
    marginVertical: 14,
  },
  invoiceLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.7)',
  },
  invoiceValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  invoiceDatesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  invoiceDatesText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  cardLimitSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  limitInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  limitLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  limitTotal: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  limitTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  limitFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricSub: {
    fontSize: 10,
    marginTop: 2,
  },
  subTabsRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  addBtnLink: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyBox: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  installmentCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  installmentTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  installmentName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  installmentCategory: {
    fontSize: 11,
    marginTop: 2,
  },
  installmentMonthlyAmt: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  installmentTotalAmt: {
    fontSize: 10,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressRemainingText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  subIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  subMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  subPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
