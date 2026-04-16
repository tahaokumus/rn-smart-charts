import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Chart, type ChartOption, type ChartRef, type DataPoint } from 'rn-smart-charts';

function nextPoint(prev: DataPoint, intervalMs: number): DataPoint {
  const x = (typeof prev.x === 'number' ? prev.x : prev.x.getTime()) + intervalMs;
  const drift = (Math.random() - 0.5) * 4;
  return { x, y: Math.max(0, prev.y + drift) };
}

const INTERVAL = 500; // ms between ticks

export function LiveUpdatingScreen() {
  const ref = useRef<ChartRef>(null);
  const [follow, setFollow] = useState(true);
  const [data, setData] = useState<DataPoint[]>(() => {
    const start = Date.now() - 60 * 60 * 1000; // last hour
    const out: DataPoint[] = [];
    let y = 100;
    for (let t = start; t <= Date.now(); t += INTERVAL * 4) {
      y += (Math.random() - 0.5) * 3;
      out.push({ x: t, y });
    }
    return out;
  });

  useEffect(() => {
    const id = setInterval(() => {
      setData((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        const next = nextPoint(last, INTERVAL);
        const out = prev.length > 1500 ? prev.slice(prev.length - 1499) : prev;
        return [...out, next];
      });
    }, INTERVAL);
    return () => clearInterval(id);
  }, []);

  // Follow latest tick on the right edge.
  useEffect(() => {
    if (!follow) return;
    const last = data[data.length - 1];
    if (last) ref.current?.panTo(last.x);
  }, [follow, data]);

  const option: ChartOption = {
    xAxis: { type: 'time', axisLabel: { color: '#888' } },
    yAxis: { type: 'value', axisLabel: { color: '#888' } },
    series: [
      {
        type: 'area',
        smooth: true,
        data,
        lineStyle: { color: '#10B981', width: 2 },
        areaStyle: { color: '#10B981', opacity: 0.25 },
      },
    ],
    animation: { enabled: true, duration: 200 },
  };

  return (
    <View style={styles.root}>
      <View style={styles.controls}>
        <Text style={styles.label}>Follow latest tick</Text>
        <Switch value={follow} onValueChange={setFollow} />
        <Pressable style={styles.btn} onPress={() => ref.current?.resetZoom()}>
          <Text style={styles.btnText}>Reset Zoom</Text>
        </Pressable>
      </View>
      <Chart ref={ref} option={option} style={styles.chart} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 16 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  label: { fontSize: 13, color: '#444' },
  btn: {
    marginLeft: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#eef',
    borderRadius: 6,
  },
  btnText: { color: '#33a', fontSize: 13, fontWeight: '500' },
  chart: { flex: 1, backgroundColor: '#fafafa', borderRadius: 12 },
});
