<script>
  import { onMount } from 'svelte';
  import { Line, Bar } from 'svelte-chartjs';
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    Filler,
    BarElement
  } from 'chart.js';

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    Filler,
    BarElement
  );

  export let dataPoints = [850, 1100, 1680, 1490, 2020, 2080, 2180, 2250, 2480, 2290, 2450, 2380, 2220, 1980, 1750, 1620, 1480, 1580, 1820, 1950, 2080, 2220, 2380, 2550, 2480, 2720, 2900, 2550, 2320, 2250, 1900];
  export let labels = ['Jan 1', 'Jan 2', 'Jan 3', 'Jan 4', 'Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11', 'Jan 12', 'Jan 13', 'Jan 14', 'Jan 15', 'Jan 16', 'Jan 17', 'Jan 18', 'Jan 19', 'Jan 20', 'Jan 21', 'Jan 22', 'Jan 23', 'Jan 24', 'Jan 25', 'Jan 26', 'Jan 27', 'Jan 28', 'Jan 29', 'Feb 15', 'Mar 24'];
  export let color = '#a855f7'; // Purple-500 by default
  export let mode = 'Tendencia'; // 'Tendencia', 'Comparar', 'Composición'

  $: datasets = getDatasets(mode);
  $: chartData = {
    labels: labels,
    datasets: datasets
  };

  function getDatasets(currentMode) {
    const baseDataset = {
      label: 'Balance Actual',
      data: dataPoints,
      borderColor: color,
      backgroundColor: currentMode === 'Composición' ? `${color}80` : (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, `${color}40`); 
        gradient.addColorStop(1, `${color}00`); 
        return gradient;
      },
      borderWidth: 2,
      borderRadius: currentMode === 'Composición' ? 4 : 0,
      tension: 0.4, 
      fill: true,
      pointBackgroundColor: '#fff',
      pointBorderColor: color,
      pointBorderWidth: 2,
      pointRadius: (context) => {
        const index = context.dataIndex;
        if (index === 0 || index === dataPoints.length - 1 || dataPoints[index] > 2800 || dataPoints[index] < 1000 || index === 16) {
          return 6;
        }
        return 0;
      },
      pointHoverRadius: 8,
    };

    if (currentMode === 'Comparar') {
      const compareDataset = {
        label: 'Periodo Anterior',
        data: dataPoints.map(v => v * (0.7 + Math.random() * 0.4)), // Dummy compare data
        borderColor: '#6b7280', // Gray for comparison
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 5,
      };
      return [baseDataset, compareDataset];
    }
    
    return [baseDataset];
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#9ca3af',
        bodyColor: '#fff',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return '$' + context.parsed.y.toLocaleString() + '.00';
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { color: color, maxTicksLimit: 7, font: { size: 12 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)', borderDash: [4, 4], drawBorder: false },
        ticks: {
          color: color,
          callback: function(value) { return '$' + value; },
          maxTicksLimit: 5,
          font: { size: 12 }
        }
      }
    },
    interaction: { intersect: false, mode: 'index' },
  };
</script>

<div class="w-full h-full min-h-[300px]">
  {#if mode === 'Composición'}
    <Bar data={chartData} options={chartOptions} />
  {:else}
    <Line data={chartData} options={chartOptions} />
  {/if}
</div>
