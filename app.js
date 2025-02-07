const { useState, useEffect } = React;

const WRVUTracker = () => {
    const [cptGroups, setCptGroups] = useState(() => {
        const saved = localStorage.getItem('cptGroups');
        return saved ? JSON.parse(saved) : [
            {
                id: 'evaluation',
                title: 'Evaluation & Management',
                codes: [
                    { code: '99213', description: 'Office Visit Level 3', wrvus: 0.97 },
                    { code: '99214', description: 'Office Visit Level 4', wrvus: 1.5 },
                    { code: '99215', description: 'Office Visit Level 5', wrvus: 2.11 }
                ]
            },
            {
                id: 'procedures',
                title: 'Procedures',
                codes: []
            }
        ];
    });

    const [dailyEntries, setDailyEntries] = useState(() => {
        const saved = localStorage.getItem('dailyEntries');
        return saved ? JSON.parse(saved) : [];
    });

    const [newCode, setNewCode] = useState({ groupId: '', code: '', description: '', wrvus: '' });
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingGroupTitle, setEditingGroupTitle] = useState(null);
    const [newGroupTitle, setNewGroupTitle] = useState('');

    useEffect(() => {
        localStorage.setItem('cptGroups', JSON.stringify(cptGroups));
    }, [cptGroups]);

    useEffect(() => {
        localStorage.setItem('dailyEntries', JSON.stringify(dailyEntries));
    }, [dailyEntries]);

    const addCPTCode = () => {
        if (newCode.groupId && newCode.code && newCode.description && newCode.wrvus) {
            setCptGroups(groups => groups.map(group => 
                group.id === newCode.groupId
                    ? { ...group, codes: [...group.codes, { 
                        code: newCode.code, 
                        description: newCode.description, 
                        wrvus: parseFloat(newCode.wrvus) 
                    }]}
                    : group
            ));
            setNewCode({ groupId: '', code: '', description: '', wrvus: '' });
        }
    };

    const addNewGroup = () => {
        const newGroup = {
            id: `group-${Date.now()}`,
            title: 'New Group',
            codes: []
        };
        setCptGroups([...cptGroups, newGroup]);
    };

    const startEditingGroupTitle = (groupId, currentTitle) => {
        setEditingGroupTitle(groupId);
        setNewGroupTitle(currentTitle);
    };

    const saveGroupTitle = (groupId) => {
        if (newGroupTitle.trim()) {
            setCptGroups(groups => groups.map(group =>
                group.id === groupId
                    ? { ...group, title: newGroupTitle.trim() }
                    : group
            ));
            setEditingGroupTitle(null);
            setNewGroupTitle('');
        }
    };

    const deleteGroup = (groupId) => {
        setCptGroups(groups => groups.filter(group => group.id !== groupId));
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

    const deleteCPTCode = (groupId, codeToDelete) => {
        setCptGroups(groups => groups.map(group =>
            group.id === groupId
                ? { ...group, codes: group.codes.filter(code => code.code !== codeToDelete) }
                : group
        ));
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

                    {cptGroups.map((group) => (
                        <div key={group.id} className="card mt-4">
                            <div className="card-header" style={{ background: 'var(--card-background)', borderBottom: '1px solid var(--border)' }}>
                                {editingGroupTitle === group.id ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newGroupTitle}
                                            onChange={(e) => setNewGroupTitle(e.target.value)}
                                            className="input flex-1"
                                            placeholder="Group Title"
                                        />
                                        <button 
                                            onClick={() => saveGroupTitle(group.id)}
                                            className="btn btn-primary"
                                        >
                                            Save
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <h2 className="card-title" style={{ color: 'var(--text-primary)' }}>{group.title}</h2>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => startEditingGroupTitle(group.id, group.title)}
                                                className="btn btn-primary"
                                            >
                                                Edit Title
                                            </button>
                                            <button 
                                                onClick={() => deleteGroup(group.id)}
                                                className="btn btn-destructive"
                                            >
                                                Delete Group
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="card-content">
                                <div className="grid">
                                    {group.codes.map((code) => (
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
                                                            onClick={() => deleteCPTCode(group.id, code.code)}
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
                            </div>
                        </div>
                    ))}

                    <div className="card mt-4">
                        <div className="p-4">
                            <h3 className="font-bold mb-2">Add New CPT Code</h3>
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    value={newCode.groupId}
                                    onChange={(e) => setNewCode({ ...newCode, groupId: e.target.value })}
                                    className="input"
                                    style={{ width: 'auto' }}
                                >
                                    <option value="">Select Group</option>
                                    {cptGroups.map(group => (
                                        <option key={group.id} value={group.id}>{group.title}</option>
                                    ))}
                                </select>
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
                            <button onClick={addNewGroup} className="btn btn-primary">
                                Add New Group
                            </button>
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
                            <button onClick={exportToCSV} className="btn btn-primary">
                                Export to CSV
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
