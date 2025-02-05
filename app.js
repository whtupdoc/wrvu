const { useState, useEffect } = React;

const WRVUTracker = () => {
    const [cptCodes, setCptCodes] = useState(() => {
        const saved = localStorage.getItem('cptCodes');
        return saved ? JSON.parse(saved) : [
            { code: '99213', description: 'Office Visit Level 3', wrvus: 0.97 },
            { code: '99214', description: 'Office Visit Level 4', wrvus: 1.5 },
            { code: '99215', description: 'Office Visit Level 5', wrvus: 2.11 }
        ];
    });

    const [dailyEntries, setDailyEntries] = useState(() => {
        const saved = localStorage.getItem('dailyEntries');
        return saved ? JSON.parse(saved) : [];
    });

    const [newCode, setNewCode] = useState({ code: '', description: '', wrvus: '' });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [exportData, setExportData] = useState('');

    useEffect(() => {
        localStorage.setItem('cptCodes', JSON.stringify(cptCodes));
    }, [cptCodes]);

    useEffect(() => {
        localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
    }, [dailyEntries]);

    const addCPTCode = () => {
        if (newCode.code && newCode.description && newCode.wrvus) {
            setCptCodes([...cptCodes, { ...newCode, wrvus: parseFloat(newCode.wrvus) }]);
            setNewCode({ code: '', description: '', wrvus: '' });
        }
    };

    const addEntry = (cptCode) => {
        const entry = {
            date: selectedDate,
            cptCode: cptCode.code,
            wrvus: cptCode.wrvus,
            timestamp: new Date().toISOString()
        };
        setDailyEntries([...dailyEntries, entry]);
    };

    const getTotalWRVUs = () => {
        return dailyEntries.reduce((sum, entry) => sum + entry.wrvus, 0).toFixed(2);
    };

    const getDailyWRVUs = (date) => {
        return dailyEntries
            .filter(entry => entry.date === date)
            .reduce((sum, entry) => sum + entry.wrvus, 0)
            .toFixed(2);
    };

    const deleteCPTCode = (codeToDelete) => {
        setCptCodes(cptCodes.filter(code => code.code !== codeToDelete));
    };

    const deleteEntry = (timestamp) => {
        setDailyEntries(dailyEntries.filter(entry => entry.timestamp !== timestamp));
    };

    const exportToCSV = () => {
        const headers = ['Date', 'CPT Code', 'wRVUs'];
        const data = dailyEntries.map(entry => [
            entry.date,
            entry.cptCode,
            entry.wrvus
        ]);
        const csv = [headers, ...data].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `wrvu-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importData = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const rows = text.split('\n').slice(1); // Skip header row
                const newEntries = rows.map(row => {
                    const [date, cptCode, wrvus] = row.split(',');
                    return {
                        date,
                        cptCode,
                        wrvus: parseFloat(wrvus),
                        timestamp: new Date().toISOString()
                    };
                });
                setDailyEntries([...dailyEntries, ...newEntries]);
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="container">
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">wRVU Tracker</h1>
                </div>
                <div className="card-content">
                    <div className="flex justify-between mb-4">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="input"
                            style={{ width: 'auto' }}
                        />
                        <div className="stats">
                            Total wRVUs: {getTotalWRVUs()}
                        </div>
                    </div>

                    <div className="grid">
                        {cptCodes.map((code) => (
                            <div key={code.code} className="card">
                                <div className="p-4">
                                    <div className="flex justify-between">
                                        <div>
                                            <div className="font-bold">{code.code}</div>
                                            <div className="text-sm text-gray-600">{code.description}</div>
                                            <div className="text-sm">wRVUs: {code.wrvus}</div>
                                        </div>
                                        <div>
                                            <button 
                                                onClick={() => addEntry(code)}
                                                className="btn btn-primary mr-2"
                                            >
                                                Add
                                            </button>
                                            <button 
                                                onClick={() => deleteCPTCode(code.code)}
                                                className="btn btn-destructive"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card mt-4">
                        <div className="p-4">
                            <h3 className="font-bold mb-2">Add New CPT Code</h3>
                            <div className="flex gap-2 flex-wrap">
                                <input
                                    placeholder="CPT Code"
                                    value={newCode.code}
                                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value })}
                                    className="input"
                                    style={{ width: 'auto' }}
                                />
                                <input
                                    placeholder="Description"
                                    value={newCode.description}
                                    onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                                    className="input flex-1"
                                />
                                <input
                                    placeholder="wRVUs"
                                    type="number"
                                    step="0.01"
                                    value={newCode.wrvus}
                                    onChange={(e) => setNewCode({ ...newCode, wrvus: e.target.value })}
                                    className="input"
                                    style={{ width: 'auto' }}
                                />
                                <button onClick={addCPTCode} className="btn btn-primary">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card mt-4">
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold">Daily Entries for {selectedDate}</h3>
                                <div className="text-sm">
                                    Daily Total: {getDailyWRVUs(selectedDate)} wRVUs
                                </div>
                            </div>
                            <div className="entry-list">
                                {dailyEntries
                                    .filter(entry => entry.date === selectedDate)
                                    .map((entry) => (
                                        <div key={entry.timestamp} className="entry-item">
                                            <div>
                                                <span className="font-medium">{entry.cptCode}</span>
                                                <span className="ml-2 text-gray-600">{entry.wrvus} wRVUs</span>
                                            </div>
                                            <button
                                                onClick={() => deleteEntry(entry.timestamp)}
                                                className="btn btn-destructive"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div className="card mt-4">
                        <div className="p-4">
                            <h3 className="font-bold mb-2">Data Management</h3>
                            <div className="flex gap-2">
                                <button onClick={exportToCSV} className="btn btn-primary">
                                    Export to CSV
                                </button>
                                <div>
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={importData}
                                        style={{ display: 'none' }}
                                        id="import-input"
                                    />
                                    <label htmlFor="import-input" className="btn btn-primary cursor-pointer">
                                        Import CSV
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

ReactDOM.render(<WRVUTracker />, document.getElementById('root'));
