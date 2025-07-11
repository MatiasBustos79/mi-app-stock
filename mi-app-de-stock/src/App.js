<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Aplicación de gestión de stock" />
    <title>Mi App de Stock</title>
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Inter Font -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- React, ReactDOM, and Babel for JSX in browser (for simplicity) -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <!-- Firebase SDKs -->
    <script type="module">
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js"; // Added signInWithCustomToken
        import { getFirestore, collection, addDoc, doc, updateDoc, onSnapshot, query, orderBy, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // Make Firebase functions globally accessible for the React script
        window.firebaseApp = initializeApp;
        window.firebaseAuth = { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken }; // Exposed signInWithCustomToken
        window.firebaseFirestore = { getFirestore, collection, addDoc, doc, updateDoc, onSnapshot, query, orderBy, where, serverTimestamp };
    </script>
    <!-- Lucide React icons (used directly as SVG for simplicity in single HTML) -->
    <!-- We'll define the icons directly in the React code to avoid external imports -->
</head>
<body>
    <noscript>Necesitas habilitar JavaScript para ejecutar esta aplicación.</noscript>
    <div id="root"></div>

    <script type="text/babel">
        // Ensure React and ReactDOM are available globally
        const { useState, useEffect, createContext, useContext } = React;
        const ReactDOM = window.ReactDOM;

        // --- Lucide Icons (simplified for single HTML file) ---
        // We'll use inline SVG for icons instead of importing from lucide-react
        const HomeIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
        const PlusCircleIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>;
        const PackageIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m7.5 4.27 9 5.14"/><path d="M2.86 9a2 2 0 0 0-.32 2.7l.54.9c.3.5.6.9.9 1.3l4.3 4.3c.6.6 1.3 1 2.1 1.2l.5.1c.3.05.6.05.9 0l.5-.1c.8-.2 1.5-.6 2.1-1.2l4.3-4.3c.3-.3.6-.7.9-1.3l.54-.9c.3-.5.4-1 .3-1.6"/><path d="m7.5 19.73 9-5.14"/><path d="M12 22v-8"/><path d="M12 22v-8"/><path d="M12 14.86 2.86 9"/><path d="m12 14.86 9.14-5.86"/></svg>;
        const AlertCircleIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>;
        const XIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
        const ChevronLeftIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m15 18-6-6 6-6"/></svg>;
        const HistoryIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 8v4l3 3"/><path d="M17.8 6.2A7.5 7.5 0 1 0 18 12h-2"/><path d="M22 12h-4"/></svg>;

        // --- Firebase Context and Provider ---
        const FirebaseContext = createContext(null);

        const FirebaseProvider = ({ children }) => {
            const [app, setApp] = useState(null);
            const [db, setDb] = useState(null);
            const [auth, setAuth] = useState(null);
            const [userId, setUserId] = useState(null);
            const [isAuthReady, setIsAuthReady] = useState(false);

            useEffect(() => {
                const initializeFirebase = async () => {
                    try {
                        // __firebase_config is provided by the Canvas environment
                        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
                        const initializedApp = window.firebaseApp(firebaseConfig);
                        const firestoreDb = window.firebaseFirestore.getFirestore(initializedApp);
                        const firebaseAuth = window.firebaseAuth.getAuth(initializedApp);

                        setApp(initializedApp);
                        setDb(firestoreDb);
                        setAuth(firebaseAuth);

                        const signIn = async () => {
                            try {
                                // __initial_auth_token is provided by the Canvas environment
                                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                                    await window.firebaseAuth.signInWithCustomToken(firebaseAuth, __initial_auth_token);
                                } else {
                                    await window.firebaseAuth.signInAnonymously(firebaseAuth);
                                }
                            } catch (error) {
                                console.error("Error signing in:", error);
                            }
                        };

                        const unsubscribe = window.firebaseAuth.onAuthStateChanged(firebaseAuth, (user) => {
                            if (user) {
                                setUserId(user.uid);
                            } else {
                                signIn();
                                setUserId(crypto.randomUUID());
                            }
                            setIsAuthReady(true);
                        });

                        return () => unsubscribe();
                    } catch (error) {
                        console.error("Failed to initialize Firebase:", error);
                    }
                };

                initializeFirebase();
            }, []);

            return (
                <FirebaseContext.Provider value={{ app, db, auth, userId, isAuthReady }}>
                    {children}
                </FirebaseContext.Provider>
            );
        };

        const useFirebase = () => useContext(FirebaseContext);

        // --- Notification Component ---
        const Notification = ({ message, type, onClose }) => {
            if (!message) return null;

            const bgColor = type === 'warning' ? 'bg-orange-500' : (type === 'success' ? 'bg-green-500' : 'bg-red-500');
            const textColor = 'text-white';

            return (
                <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg ${bgColor} ${textColor} flex items-center justify-between z-50`}>
                    <span>{message}</span>
                    <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white hover:bg-opacity-20">
                        <XIcon size={18} />
                    </button>
                </div>
            );
        };

        // --- Product List Component ---
        const ProductList = ({ onSelectProduct, onAddProduct, products, userId, userName, setUserName }) => {
            return (
                <div className="p-4">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Mis Productos</h2>
                    {userId && (
                        <div className="text-sm text-gray-600 mb-4 text-center break-words">
                            <label htmlFor="userNameInput" className="block text-gray-700 text-sm font-bold mb-1">Tu Nombre:</label>
                            <input
                                type="text"
                                id="userNameInput"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                placeholder="Ingresa tu nombre"
                            />
                            <p className="mt-2">ID de Sesión: <span className="font-mono text-xs">{userId}</span></p>
                        </div>
                    )}
                    <button
                        onClick={onAddProduct}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md flex items-center justify-center mb-6 transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        <PlusCircleIcon size={20} className="mr-2" />
                        Agregar Nuevo Producto
                    </button>

                    {products.length === 0 ? (
                        <p className="text-center text-gray-600 mt-8">No hay productos cargados aún. ¡Agrega uno!</p>
                    ) : (
                        <div className="space-y-4">
                            {products.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => onSelectProduct(product)}
                                    className={`bg-white p-4 rounded-xl shadow-md cursor-pointer flex justify-between items-center transition duration-200 ease-in-out transform hover:scale-[1.02]
                                        ${product.currentStock <= product.warningThreshold ? 'border-l-4 border-orange-500' : 'border-l-4 border-transparent'}
                                    `}
                                >
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                                        <p className="text-sm text-gray-600">Categoría: {product.category}</p>
                                        <p className="text-sm text-gray-700">Stock Actual: <span className="font-bold">{product.currentStock}</span></p>
                                    </div>
                                    {product.currentStock <= product.warningThreshold && (
                                        <AlertCircleIcon size={24} className="text-orange-500 flex-shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        // --- Stock History Component ---
        const StockHistory = ({ productId, appId }) => {
            const { db, isAuthReady } = useFirebase();
            const [history, setHistory] = useState([]);
            const [filterType, setFilterType] = useState('all');
            const [filterStartDate, setFilterStartDate] = useState('');
            const [filterEndDate, setFilterEndDate] = useState('');

            useEffect(() => {
                if (!db || !isAuthReady || !productId) {
                    return;
                }

                const historyCollectionRef = window.firebaseFirestore.collection(db, `artifacts/${appId}/public/data/stock_history`);
                let q = window.firebaseFirestore.query(historyCollectionRef, window.firebaseFirestore.where('productId', '==', productId));

                const unsubscribe = window.firebaseFirestore.onSnapshot(q, (snapshot) => {
                    let historyData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : null
                    }));

                    let filteredHistory = historyData.filter(entry => {
                        if (filterType !== 'all' && entry.changeType !== filterType) {
                            return false;
                        }

                        const entryDate = entry.timestamp;
                        if (filterStartDate && entryDate) {
                            const startDateObj = new Date(filterStartDate);
                            startDateObj.setHours(0, 0, 0, 0);
                            if (entryDate < startDateObj) {
                                return false;
                            }
                        }
                        if (filterEndDate && entryDate) {
                            const endDateObj = new Date(filterEndDate);
                            endDateObj.setHours(23, 59, 59, 999);
                            if (entryDate > endDateObj) {
                                return false;
                            }
                        }
                        return true;
                    });

                    filteredHistory.sort((a, b) => {
                        if (!a.timestamp && !b.timestamp) return 0;
                        if (!a.timestamp) return 1;
                        if (!b.timestamp) return -1;
                        return b.timestamp.getTime() - a.timestamp.getTime();
                    });

                    setHistory(filteredHistory);
                }, (error) => {
                    console.error("Error fetching stock history:", error);
                });

                return () => unsubscribe();
            }, [db, isAuthReady, productId, appId, filterType, filterStartDate, filterEndDate]);

            return (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <HistoryIcon size={20} className="mr-2" />
                        Historial de Cambios
                    </h3>

                    <div className="bg-white p-4 rounded-xl shadow-md mb-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
                            <label htmlFor="filterType" className="font-medium text-gray-700">Filtrar por tipo:</label>
                            <select
                                id="filterType"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="flex-grow border rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todos</option>
                                <option value="increase">Suma</option>
                                <option value="decrease">Resta</option>
                                <option value="manual_set">Manual</option>
                            </select>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
                            <label htmlFor="filterStartDate" className="font-medium text-gray-700">Desde:</label>
                            <input
                                type="date"
                                id="filterStartDate"
                                value={filterStartDate}
                                onChange={(e) => setFilterStartDate(e.target.value)}
                                className="flex-grow border rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor="filterEndDate" className="font-medium text-gray-700">Hasta:</label>
                            <input
                                type="date"
                                id="filterEndDate"
                                value={filterEndDate}
                                onChange={(e) => setFilterEndDate(e.target.value)}
                                className="flex-grow border rounded-lg py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {history.length === 0 ? (
                        <p className="text-center text-gray-600">No hay cambios registrados para este producto con los filtros aplicados.</p>
                    ) : (
                        <div className="space-y-3">
                            {history.map(entry => (
                                <div key={entry.id} className="bg-gray-50 p-3 rounded-lg shadow-sm text-sm">
                                    <p className="text-gray-800 font-semibold">
                                        {entry.timestamp ? entry.timestamp.toLocaleString() : 'Fecha desconocida'}
                                    </p>
                                    <p className="text-gray-700">
                                        <span className="font-medium">
                                            {entry.changeType === 'increase' ? 'Suma' :
                                             entry.changeType === 'decrease' ? 'Resta' : 'Manual'} de {Math.abs(entry.changeAmount)}
                                        </span> unidades
                                        (De {entry.oldStock} a {entry.newStock})
                                    </p>
                                    <p className="text-gray-600 text-xs mt-1">
                                        Por usuario: <span className="font-mono">{entry.userName || entry.userId}</span>
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        // --- Product Detail Component ---
        const ProductDetail = ({ product, onBack, onUpdateStock, appId, setNotification }) => {
            const [changeAmountInput, setChangeAmountInput] = useState(1);

            const handleApplyChange = (amount, type) => {
                if (isNaN(amount) || amount <= 0) {
                    setNotification({ message: 'Por favor, ingresa una cantidad válida mayor a 0.', type: 'error' });
                    return;
                }

                const oldStock = product.currentStock;
                let newStock;
                let changeType;

                if (type === 'add') {
                    newStock = oldStock + amount;
                    changeType = 'increase';
                } else if (type === 'subtract') {
                    newStock = oldStock - amount;
                    if (newStock < 0) {
                        newStock = 0;
                        setNotification({ message: 'El stock no puede ser negativo. Se ha establecido en 0.', type: 'warning' });
                    }
                    changeType = 'decrease';
                }

                onUpdateStock(product.id, oldStock, newStock, changeType, product.name);
                setChangeAmountInput(1);
            };

            const handleManualStockChange = (e) => {
                const newStock = parseInt(e.target.value, 10);
                if (!isNaN(newStock)) {
                    const oldStock = product.currentStock;
                    const changeAmount = newStock - oldStock;
                    onUpdateStock(product.id, oldStock, newStock, 'manual_set', product.name);
                }
            };

            return (
                <div className="p-4">
                    <button
                        onClick={onBack}
                        className="text-blue-600 hover:text-blue-800 flex items-center mb-6 font-semibold transition duration-200 ease-in-out"
                    >
                        <ChevronLeftIcon size={20} className="mr-1" />
                        Volver a la Lista
                    </button>
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">{product.name}</h2>

                    <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                        <p className="text-lg text-gray-700"><span className="font-semibold">Categoría:</span> {product.category}</p>
                        <p className="text-lg text-gray-700"><span className="font-semibold">Umbral de Advertencia:</span> {product.warningThreshold}</p>

                        <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                            <p className="text-xl text-gray-800 font-semibold">Stock Actual:</p>
                            <input
                                type="number"
                                value={product.currentStock}
                                onChange={handleManualStockChange}
                                className="w-24 text-center text-3xl font-bold border-2 border-gray-300 rounded-lg py-2 focus:border-blue-500 focus:ring-blue-500 transition duration-200"
                            />
                        </div>

                        {product.currentStock <= product.warningThreshold && (
                            <div className="flex items-center text-orange-600 bg-orange-100 p-3 rounded-lg font-semibold">
                                <AlertCircleIcon size={20} className="mr-2" />
                                ¡Advertencia! Stock bajo.
                            </div>
                        )}

                        <div className="flex flex-col items-center justify-center space-y-4 mt-6">
                            <div className="flex items-center space-x-2">
                                <label htmlFor="changeAmount" className="text-gray-700 font-medium">Cantidad a ajustar:</label>
                                <input
                                    type="number"
                                    id="changeAmount"
                                    value={changeAmountInput}
                                    onChange={(e) => setChangeAmountInput(parseInt(e.target.value, 10) || 0)}
                                    className="w-24 text-center text-xl font-bold border-2 border-gray-300 rounded-lg py-2 focus:border-blue-500 focus:ring-blue-500 transition duration-200"
                                    min="0"
                                />
                            </div>
                            <div className="flex space-x-4">
                                <button
                                    onClick={() => handleApplyChange(changeAmountInput, 'subtract')}
                                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    Restar
                                </button>
                                <button
                                    onClick={() => handleApplyChange(changeAmountInput, 'add')}
                                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl shadow-md transition duration-300 ease-in-out transform hover:scale-105"
                                >
                                    Sumar
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* Stock History Component */}
                    <StockHistory productId={product.id} appId={appId} />
                </div>
            );
        };

        // --- Add Product Form Component ---
        const AddProductForm = ({ onBack, onAddProduct, setNotification, userName }) => {
            const [category, setCategory] = useState('');
            const [name, setName] = useState('');
            const [currentStock, setCurrentStock] = useState(0);
            const [warningThreshold, setWarningThreshold] = useState(0);

            const handleSubmit = (e) => {
                e.preventDefault();
                if (!name || !category) {
                    setNotification({ message: 'Por favor, completa todos los campos obligatorios.', type: 'error' });
                    return;
                }
                onAddProduct({ category, name, currentStock, warningThreshold, userName });
                onBack();
            };

            return (
                <div className="p-4">
                    <button
                        onClick={onBack}
                        className="text-blue-600 hover:text-blue-800 flex items-center mb-6 font-semibold transition duration-200 ease-in-out"
                    >
                        <ChevronLeftIcon size={20} className="mr-1" />
                        Volver a la Lista
                    </button>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Agregar Nuevo Producto</h2>
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg space-y-5">
                        <div>
                            <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">
                                Categoría:
                            </label>
                            <input
                                type="text"
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                placeholder="Ej: Electrónica, Alimentos"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                                Nombre del Producto:
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                placeholder="Ej: Laptop, Manzanas"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="currentStock" className="block text-gray-700 text-sm font-bold mb-2">
                                Stock Actual:
                            </label>
                            <input
                                type="number"
                                id="currentStock"
                                value={currentStock}
                                onChange={(e) => setCurrentStock(parseInt(e.target.value, 10))}
                                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                min="0"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="warningThreshold" className="block text-gray-700 text-sm font-bold mb-2">
                                Umbral de Advertencia:
                            </label>
                            <input
                                type="number"
                                id="warningThreshold"
                                value={warningThreshold}
                                onChange={(e) => setWarningThreshold(parseInt(e.target.value, 10))}
                                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                min="0"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md flex items-center justify-center transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            <PlusCircleIcon size={20} className="mr-2" />
                            Guardar Producto
                        </button>
                    </form>
                </div>
            );
        };

        // --- Main App Component ---
        const App = () => {
            const { db, userId, isAuthReady, app } = useFirebase();
            const [products, setProducts] = useState([]);
            const [selectedProduct, setSelectedProduct] = useState(null);
            const [view, setView] = useState('list');
            const [notification, setNotification] = useState({ message: '', type: '' });
            const [userName, setUserName] = useState(() => localStorage.getItem('stockAppUserName') || 'Usuario Anónimo');

            useEffect(() => {
                localStorage.setItem('stockAppUserName', userName);
            }, [userName]);

            // __app_id is provided by the Canvas environment
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

            useEffect(() => {
                if (!db || !isAuthReady || !userId) {
                    console.log("Firestore not ready or user not authenticated.");
                    return;
                }

                const productsCollectionRef = window.firebaseFirestore.collection(db, `artifacts/${appId}/public/data/products`);
                const q = window.firebaseFirestore.query(productsCollectionRef);

                const unsubscribe = window.firebaseFirestore.onSnapshot(q, (snapshot) => {
                    const productsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setProducts(productsData);

                    if (selectedProduct) {
                        const updatedSelectedProduct = productsData.find(p => p.id === selectedProduct.id);
                        if (updatedSelectedProduct) {
                            setSelectedProduct(updatedSelectedProduct);
                        }
                    }

                    productsData.forEach(product => {
                        if (product.currentStock <= product.warningThreshold && product.currentStock > 0) {
                            setNotification({
                                message: `¡Advertencia! El stock de "${product.name}" es bajo (${product.currentStock} unidades).`,
                                type: 'warning'
                            });
                        }
                    });
                }, (error) => {
                    console.error("Error fetching products:", error);
                    if (error.code === 'permission-denied') {
                        setNotification({ message: 'Error de permisos: No tienes autorización para leer los productos. Por favor, revisa las reglas de seguridad de Firestore.', type: 'error' });
                    } else {
                        setNotification({ message: `Error al cargar productos: ${error.message}`, type: 'error' });
                    }
                });

                return () => unsubscribe();
            }, [db, userId, isAuthReady, appId, selectedProduct]);

            const handleAddProduct = async (productData) => {
                if (!db) {
                    console.error("Firestore DB not initialized.");
                    setNotification({ message: 'Error: Base de datos no disponible.', type: 'error' });
                    return;
                }
                try {
                    await window.firebaseFirestore.addDoc(window.firebaseFirestore.collection(db, `artifacts/${appId}/public/data/products`), {
                        ...productData,
                        currentStock: Number(productData.currentStock),
                        warningThreshold: Number(productData.warningThreshold),
                        userId: userId,
                        userName: userName
                    });
                    setNotification({ message: 'Producto agregado con éxito!', type: 'success' });
                } catch (e) {
                    console.error("Error adding document: ", e);
                    if (e.code === 'permission-denied') {
                        setNotification({ message: 'Error de permisos: No tienes autorización para agregar productos. Por favor, revisa las reglas de seguridad de Firestore.', type: 'error' });
                    } else {
                        setNotification({ message: `Error al agregar producto: ${e.message}`, type: 'error' });
                    }
                }
            };

            const handleUpdateStock = async (productId, oldStock, newStock, changeType, productName) => {
                if (!db) {
                    console.error("Firestore DB not initialized.");
                    setNotification({ message: 'Error: Base de datos no disponible.', type: 'error' });
                    return;
                }
                try {
                    const productRef = window.firebaseFirestore.doc(db, `artifacts/${appId}/public/data/products`, productId);
                    await window.firebaseFirestore.updateDoc(productRef, { currentStock: Number(newStock) });

                    await window.firebaseFirestore.addDoc(window.firebaseFirestore.collection(db, `artifacts/${appId}/public/data/stock_history`), {
                        productId: productId,
                        productName: productName,
                        oldStock: Number(oldStock),
                        newStock: Number(newStock),
                        changeAmount: Number(newStock - oldStock),
                        changeType: changeType,
                        userId: userId,
                        userName: userName,
                        timestamp: window.firebaseFirestore.serverTimestamp()
                    });

                    setNotification({ message: 'Stock actualizado con éxito!', type: 'success' });
                } catch (e) {
                    console.error("Error updating stock or adding history:", e);
                    if (e.code === 'permission-denied') {
                        setNotification({ message: 'Error de permisos: No tienes autorización para actualizar el stock o el historial. Por favor, revisa las reglas de seguridad de Firestore.', type: 'error' });
                    } else {
                        setNotification({ message: `Error al actualizar stock: ${e.message}`, type: 'error' });
                    }
                }
            };

            const renderView = () => {
                switch (view) {
                    case 'list':
                        return (
                            <ProductList
                                onSelectProduct={(product) => { setSelectedProduct(product); setView('detail'); }}
                                onAddProduct={() => setView('add')}
                                products={products}
                                userId={userId}
                                userName={userName}
                                setUserName={setUserName}
                            />
                        );
                    case 'detail':
                        return (
                            <ProductDetail
                                product={selectedProduct}
                                onBack={() => setView('list')}
                                onUpdateStock={handleUpdateStock}
                                appId={appId}
                                setNotification={setNotification}
                            />
                        );
                    case 'add':
                        return (
                            <AddProductForm
                                onBack={() => setView('list')}
                                onAddProduct={handleAddProduct}
                                setNotification={setNotification}
                                userName={userName}
                            />
                        );
                    default:
                        return null;
                }
            };

            return (
                <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-900">
                    <style>
                        {`
                        body {
                            font-family: 'Inter', sans-serif;
                        }
                        `}
                    </style>
                    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden md:max-w-lg my-8">
                        {renderView()}
                    </div>
                    <Notification
                        message={notification.message}
                        type={notification.type}
                        onClose={() => setNotification({ message: '', type: '' })}
                    />
                </div>
            );
        };

        // Render the main App component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(
            <React.StrictMode>
                <FirebaseProvider>
                    <App />
                </FirebaseProvider>
            </React.StrictMode>
        );
    </script>
</body>
</html>
