<div align="center">

# 🌾 Consechas • TerraTrust
### Plataforma Descentralizada (dApp Web3) de Compra, Venta y Trazabilidad Agrícola

[![Valle Grande](https://img.shields.io/badge/Organización-Valle%20Grande-blue?style=for-the-badge)](https://github.com/vallegrande)
[![Curso](https://img.shields.io/badge/Módulo-Innovación%20Blockchain%20(PIB)-orange?style=for-the-badge)](https://github.com/vallegrande/AS241S6_15_SmartContracts)
[![Rama](https://img.shields.io/badge/Rama%20Activa-develop-success?style=for-the-badge&logo=git)](https://github.com/vallegrande/AS241S6_15_SmartContracts/tree/develop)
[![Código Estándar](https://img.shields.io/badge/Estándar-AS241S6__15__SmartContracts-lightgrey?style=for-the-badge)](https://github.com/vallegrande/AS241S6_15_SmartContracts)

<br/>

[![Svelte 5](https://img.shields.io/badge/Svelte%205-FF3E00?style=flat-square&logo=svelte&logoColor=white)](https://svelte.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Ethers.js v6](https://img.shields.io/badge/Ethers.js_v6-2535A0?style=flat-square&logo=ethereum&logoColor=white)](https://docs.ethers.org/v6/)
[![Express 5](https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_DB-336791?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech/)
[![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

**Despliegue en Producción (Cloud):** [https://consechas.onrender.com](https://consechas.onrender.com)

</div>

---

## 📌 1. Descripción del Proyecto

**Consechas (TerraTrust)** es una aplicación descentralizada (dApp Web3) diseñada para eliminar intermediarios abusivos en el comercio agrícola, conectando de forma directa a productores agrícolas del **Valle de Cañete y Nuevo Imperial** con compradores y agroexportadores.

A través de **Smart Contracts** y transacciones P2P verificadas en la Blockchain, los fondos de pago se resguardan bajo custodia inmutable hasta la confirmación de recepción física de las cosechas, garantizando trazabilidad digital, transparencia y pagos instantáneos con criptoactivos.

---

## 📋 2. Matriz de Cumplimiento de la Rúbrica (PIB - Valle Grande)

| Criterio de la Rúbrica | Estado | Implementación en el Proyecto |
| :--- | :---: | :--- |
| **Repositorio privado en organización Valle Grande** | ✅ **Cumplido** | Repositorio: `vallegrande/AS241S6_15_SmartContracts` |
| **Rama de trabajo estándar: `develop`** | ✅ **Cumplido** | Rama `develop` activa y configurada como rama predeterminada |
| **1) Cierre de Sesión en la dApp** | ✅ **Cumplido** | Modal interactivo de confirmación; revocación de estado y solicitud obligatoria de permisos al re-iniciar sesión con la Wallet |
| **2) Mapeo funcional de mín. 3 Redes Testnet** | ✅ **Cumplido** | **zkSYS Testnet**, **Ethereum Hoodi**, **Sepolia** (+ 6 redes adicionales compatibles) |
| **2.a) Alternancia / Cambio dinámico de redes** | ✅ **Cumplido** | Invocación `wallet_switchEthereumChain` con auto-añadido automático ante error `4902` (`wallet_addEthereumChain`) |
| **2.b) Transacciones reales On-Chain multi-red** | ✅ **Cumplido** | Transferencias wallet-a-wallet y pagos de contratos firmados y emitidos según la red conectada |
| **2.c) Filtrado de historial por red conectada** | ✅ **Cumplido** | Consulta en tiempo real persistida en Neon PostgreSQL con filtro reactivo según la red seleccionada |
| **Enlaces directos a exploradores oficiales** | ✅ **Cumplido** | Etherscan (Sepolia), Beaconcha.in (Hoodi), zkSYS Explorer (Tanenbaum) |

---

## 🌐 3. Mapeo Oficial de Redes Blockchain

La dApp cuenta con soporte y detección automática para las redes testnet requeridas por la evaluación académica:

```
                  ┌─────────────────────────────────────────────────────────────┐
                  │                 CONSECHAS WEB3 ENGINE                       │
                  └───────────────┬─────────────────────────────┬───────────────┘
                                  │                             │
                   ┌──────────────┴──────────────┐┌─────────────┴──────────────┐
                   │       METAMASK / PALI       ││      NEON POSTGRESQL       │
                   └──────────────┬──────────────┘└────────────────────────────┘
                                  │
      ┌───────────────────────────┼───────────────────────────┐
      │                           │                           │
┌─────▼───────────────┐ ┌─────────▼─────────────┐ ┌───────────▼─────────────┐
│    zkSYS Testnet    │ │    Ethereum Hoodi     │ │     Sepolia Testnet     │
│  Chain ID: 0xdee1   │ │  Chain ID: 0x88bb0    │ │   Chain ID: 0xaa36a7    │
│  Moneda: TSYS       │ │  Moneda: ETH          │ │   Moneda: ETH           │
└─────────────────────┘ └───────────────────────┘ └─────────────────────────┘
```

### Tabla de Configuración de Redes Evaluadas

| Red | Chain ID (Hex / Dec) | Moneda | Endpoint RPC Público | Explorador de Bloques |
| :--- | :---: | :---: | :--- | :--- |
| **zkSYS Testnet** | `0xdee1` (57057) | `TSYS` | `https://rpc-zk.tanenbaum.io` | [explorer-zk.tanenbaum.io](https://explorer-zk.tanenbaum.io) |
| **Ethereum Hoodi** | `0x88bb0` (560048) | `ETH` | `https://0xrpc.io/hoodi` | [light-hoodi.beaconcha.in](https://light-hoodi.beaconcha.in) |
| **Sepolia** | `0xaa36a7` (11155111) | `ETH` | `https://ethereum-sepolia-rpc.publicnode.com` | [sepolia.etherscan.io](https://sepolia.etherscan.io) |
| **Syscoin Testnet** | `0x1644` (5700) | `tSYS` | `https://rpc.tanenbaum.io` | [tanenbaum.io](https://tanenbaum.io) |
| **Base Sepolia** | `0x14a34` (84532) | `ETH` | `https://sepolia.base.org` | [sepolia-explorer.base.org](https://sepolia-explorer.base.org) |
| **Rollux** | `0x15f90` (570) | `SYS` | `https://rpc.rollux.com` | [explorer.rollux.com](https://explorer.rollux.com) |
| **Polygon Mainnet** | `0x89` (137) | `MATIC`| `https://polygon.llamarpc.com` | [polygonscan.com](https://polygonscan.com) |

---

## 🔒 4. Funcionalidades Clave de la dApp

### 1) Autenticación y Cierre de Sesión Seguro
- **Soporte Multi-Wallet**: Detección nativa de **MetaMask** y **Pali Wallet** con prioridad EIP-6963.
- **Cierre de Sesión Protegido**: Botón de desconexión con modal de confirmación para evitar cierres accidentales.
- **Re-autenticación Estricta**: Al cerrar sesión se limpian estados de memoria y `localStorage`, exigiendo re-autorización explícita en la extensión para cualquier nueva operación.

### 2) Venta y Compra Agrícola con Bloqueo de Fondos (Escrow)
- **Mercado Spot y de Futuros**: Catálogo de productos agrícolas (Palta Hass, Uva Quebranta, Cacao, Mango, Arándano) con precios en testnet fijados para validaciones seguras.
- **Monto de Transacción Protegido**: El monto a transferir se deriva de forma reactiva y matemáticamente inmutable (`$derived`) según el carrito, impidiendo alteraciones arbitrarias desde el cliente.
- **Desplegable de Pago Opaco**: Menú selector de red/moneda con fondo sólido `#1e2329` y capas `z-index` optimizadas para evitar transparencias indebidas.

### 3) Transferencias Wallet-a-Wallet y Consulta Masiva de Saldos
- Envío directo de fondos entre billeteras con validación de dirección EVM (`0x...`).
- Consulta multi-RPC en tiempo real en la vista **Saldos** (individual o masiva) sin depender de balance estimado.
- Historial filtrado de forma reactiva por la red conectada (`zkSYS`, `Hoodi`, `Sepolia`, etc.).

### 4) Persistencia Real en Base de Datos (Neon PostgreSQL Cloud)
A diferencia de prototipos que dependen exclusivamente de `localStorage`, Consechas sincroniza cada transacción con PostgreSQL en la nube:
- Tabla `orders`: Registro de órdenes de compra, hash de blockchain, billetera compradora, beneficiario, red y explorador.
- Tabla `transfers`: Historial de transferencias directas wallet-a-wallet con estatus confirmado.
- Tabla `products`: Catálogo de productos agrícolas ofertados.
- Tabla `lotes`: Registro inmutable del productor para seguimiento de cosecha.

---

## 🛠️ 5. Estructura del Repositorio

```text
Consechas/
├── backend/                        # Servidor API Node.js + Express 5
│   ├── database.js                 # Pool de conexiones y migraciones Neon PostgreSQL
│   ├── server.js                   # Endpoints REST API y fallback SPA de producción
│   └── package.json                # Dependencias (express, cors, pg)
├── svelte-dapp/                    # Frontend Web3 en Svelte 5
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppMenuBar.svelte   # Barra de navegación flotante
│   │   │   ├── BalanceView.svelte  # Consulta individual y masiva de saldos RPC
│   │   │   ├── CartView.svelte     # Carrito Web3 y firma de compra (Escrow)
│   │   │   ├── FarmerView.svelte   # Panel del productor agrícola y registro de lote
│   │   │   ├── MarketView.svelte   # Catálogo de cosechas Spot y Futuros
│   │   │   ├── ReceiptView.svelte  # Boleta electrónica imprimible / PDF con Tx Hash
│   │   │   ├── TrackingView.svelte # Trazabilidad de la cosecha y calificaciones
│   │   │   └── TransferView.svelte # Transferencias wallet-a-wallet multired
│   │   ├── App.svelte              # Estado global, conexión Web3 y mapeo de redes
│   │   ├── config.js               # Enrutamiento dinámico local / Docker / Cloud
│   │   └── main.js
│   ├── package.json
│   └── vite.config.js              # Configuración Vite 8 + Tailwind CSS v4
├── Dockerfile                      # Compilación multi-stage (Node 20 Alpine)
├── docker-compose.yml              # Orquestación de contenedor único
└── README.md                       # Documentación oficial del proyecto
```

---

## 🚀 6. Guía de Instalación y Ejecución Local

### Prerrequisitos
- **Node.js**: Versión `>= 20.x`
- **npm**: Versión `>= 10.x`
- **Git**
- Extensión de navegador: **MetaMask** o **Pali Wallet**

### Pasos de Instalación

1. **Clonar el repositorio y ubicarse en la rama `develop`:**
   ```bash
   git clone https://github.com/vallegrande/AS241S6_15_SmartContracts.git
   cd AS241S6_15_SmartContracts
   git checkout develop
   ```

2. **Instalar dependencias del Backend:**
   ```bash
   cd backend
   npm install
   ```

3. **Instalar dependencias del Frontend:**
   ```bash
   cd ../svelte-dapp
   npm install
   ```

4. **Iniciar ambos entornos de desarrollo:**
   - **Terminal 1 (Backend):**
     ```bash
     cd backend
     npm start
     # Servidor disponible en http://localhost:3000
     ```
   - **Terminal 2 (Frontend Svelte 5):**
     ```bash
     cd svelte-dapp
     npm run dev
     # dApp disponible en http://localhost:5173
     ```

5. **Abrir en el navegador:**
   Ingresar a [http://localhost:5173](http://localhost:5173) y conectar la billetera Web3.

---

## 🐳 7. Ejecución con Docker

El proyecto cuenta con despliegue contenerizado multi-etapa:

```bash
# Construir y levantar el contenedor
docker compose up --build -d

# Acceder a la dApp compilada con backend integrado
# URL: http://localhost:3000
```

---

## 👨‍💻 8. Información del Autor y Evaluación

- **Estudiante:** Luis Enrique Huaraca Huamán
- **Correo Institucional:** `luis.huaraca.h@vallegrande.edu.pe`
- **Institución:** Instituto de Educación Superior Valle Grande
- **Módulo Académico:** Proyecto de Innovación Blockchain (PIB)
- **Repositorio Oficial:** [vallegrande/AS241S6_15_SmartContracts](https://github.com/vallegrande/AS241S6_15_SmartContracts)
- **Rama Oficial de Revisión:** [`develop`](https://github.com/vallegrande/AS241S6_15_SmartContracts/tree/develop)

---

<div align="center">
  <sub>Desarrollado con compromiso por la descentralización y el desarrollo agrícola peruano 🇵🇪.</sub>
</div>
