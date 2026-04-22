import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { emotionApi, EmotionAggregate, GroupBy } from '@/src/api/emotion';

const LEVEL_CONFIG = {
  NORMAL: { color: '#16a34a', label: '정상' },
  CAUTION: { color: '#d97706', label: '주의' },
  DANGER:  { color: '#dc2626', label: '위험' },
};

const TABS: { key: GroupBy; label: string }[] = [
  { key: 'day',   label: '일별' },
  { key: 'week',  label: '주별' },
  { key: 'month', label: '월별' },
];

const CHART_H = 160;
const BAR_W = 44;

function formatPeriod(period: string, groupBy: GroupBy): string {
  const m = parseInt(period.slice(5, 7));
  const d = period.length >= 10 ? parseInt(period.slice(8, 10)) : 1;
  if (groupBy === 'month') return `${m}월`;
  if (groupBy === 'week')  return `${m}/${d}~`;
  return `${m}/${d}`;
}

function BarChart({ data, groupBy }: { data: EmotionAggregate[]; groupBy: GroupBy }) {
  if (data.length === 0) {
    return <Text style={styles.emptyText}>이 기간에 기록이 없어요.</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartScroll}>
      <View style={styles.chartRow}>
        {data.map((item, i) => {
          const barH = Math.max(4, (item.avgScore / 100) * CHART_H);
          const cfg = LEVEL_CONFIG[item.level];
          const scoreLabelTop = CHART_H - barH - 18;

          return (
            <View key={i} style={styles.barColumn}>
              <View style={styles.chartArea}>
                <Text style={[styles.barScore, { top: Math.max(0, scoreLabelTop), color: cfg.color }]}>
                  {item.avgScore}
                </Text>
                <View style={[styles.bar, { height: barH, backgroundColor: cfg.color }]} />
              </View>
              <Text style={styles.periodLabel}>{formatPeriod(item.period, groupBy)}</Text>
              <Text style={styles.countLabel}>{item.count}회</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function Summary({ data }: { data: EmotionAggregate[] }) {
  if (data.length === 0) return null;

  const avg = Math.round(data.reduce((s, d) => s + d.avgScore, 0) / data.length);
  const max = Math.max(...data.map(d => d.avgScore));
  const total = data.reduce((s, d) => s + d.count, 0);

  const avgCfg = LEVEL_CONFIG[avg >= 70 ? 'DANGER' : avg >= 40 ? 'CAUTION' : 'NORMAL'];

  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue} numberOfLines={1}>
          <Text style={{ color: avgCfg.color }}>{avg}</Text>
          <Text style={styles.summaryUnit}>/100</Text>
        </Text>
        <Text style={styles.summaryLabel}>평균 스트레스</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{max}<Text style={styles.summaryUnit}>/100</Text></Text>
        <Text style={styles.summaryLabel}>최고 스트레스</Text>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>{total}<Text style={styles.summaryUnit}>회</Text></Text>
        <Text style={styles.summaryLabel}>총 기록</Text>
      </View>
    </View>
  );
}

export default function History() {
  const [groupBy, setGroupBy] = useState<GroupBy>('day');
  const [data, setData] = useState<EmotionAggregate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (gb: GroupBy) => {
    try {
      const res = await emotionApi.historyChart(gb);
      setData(res.data);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setData([]);
    load(groupBy);
  }, [groupBy, load]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(groupBy); }}
        />
      }
    >
      <Text style={styles.title}>스트레스 추이</Text>

      {/* 탭 */}
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, groupBy === tab.key && styles.tabActive]}
            onPress={() => setGroupBy(tab.key)}
          >
            <Text style={[styles.tabText, groupBy === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 차트 */}
      <View style={styles.chartCard}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#5348b7" />
          </View>
        ) : (
          <BarChart data={data} groupBy={groupBy} />
        )}
      </View>

      {/* 요약 */}
      {!loading && <Summary data={data} />}

      {/* 레벨 범례 */}
      <View style={styles.legend}>
        {Object.entries(LEVEL_CONFIG).map(([key, cfg]) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: cfg.color }]} />
            <Text style={styles.legendText}>{cfg.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937', marginBottom: 20 },

  tabs: { flexDirection: 'row', backgroundColor: '#e5e7eb', borderRadius: 10, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
  tabTextActive: { color: '#5348b7', fontWeight: '700' },

  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    minHeight: CHART_H + 80,
    justifyContent: 'center',
  },
  loadingBox: { height: CHART_H, justifyContent: 'center', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: '#9ca3af', paddingVertical: 40 },

  chartScroll: { marginTop: 8 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 4 },
  barColumn: { width: BAR_W + 8, alignItems: 'center', marginHorizontal: 2 },
  chartArea: { width: BAR_W, height: CHART_H, justifyContent: 'flex-end', position: 'relative' },
  barScore: { position: 'absolute', fontSize: 10, fontWeight: '600', width: BAR_W, textAlign: 'center' },
  bar: { width: BAR_W - 6, borderRadius: 4 },
  periodLabel: { fontSize: 9, color: '#9ca3af', marginTop: 5, textAlign: 'center' },
  countLabel: { fontSize: 8, color: '#d1d5db' },

  summaryRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    elevation: 1,
  },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' },
  summaryUnit: { fontSize: 13, color: '#9ca3af', fontWeight: '400' },
  summaryLabel: { fontSize: 11, color: '#9ca3af', marginTop: 4 },

  legend: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#6b7280' },
});
