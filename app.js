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
const { useState, useEffect } = React;

const WRVUTracker = () => {
    // ... [Previous state declarations remain the same] ...

    const [dragGroup, setDragGroup] = useState(null);
    const [dragCode, setDragCode] = useState(null);
    const [dragOverGroup, setDragOverGroup] = useState(null);
    const [dragOverCode, setDragOverCode] = useState(null);

    // Drag and Drop handlers for Groups
    const handleGroupDragStart = (e, groupId) => {
        setDragGroup(groupId);
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.5';
    };

    const handleGroupDragEnd = (e) => {
        setDragGroup(null);
        setDragOverGroup(null);
        e.target.style.opacity = '1';
    };

    const handleGroupDragOver = (e, groupId) => {
        e.preventDefault();
        if (dragGroup !== groupId) {
            setDragOverGroup(groupId);
        }
    };

    const handleGroupDrop = (e, targetGroupId) => {
        e.preventDefault();
        if (dragGroup && dragGroup !== targetGroupId) {
            setCptGroups(groups => {
                const reorderedGroups = [...groups];
                const draggedGroup = reorderedGroups.find(g => g.id === dragGroup);
                const targetIndex = reorderedGroups.findIndex(g => g.id === targetGroupId);
                const sourceIndex = reorderedGroups.findIndex(g => g.id === dragGroup);
                
                reorderedGroups.splice(sourceIndex, 1);
                reorderedGroups.splice(targetIndex, 0, draggedGroup);
                
                return reorderedGroups;
            });
        }
    };
    // Drag and Drop handlers for CPT Codes
    const handleCodeDragStart = (e, groupId, code) => {
        setDragCode({ groupId, code: code.code });
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.5';
    };

    const handleCodeDragEnd = (e) => {
        setDragCode(null);
        setDragOverCode(null);
        e.target.style.opacity = '1';
    };

    const handleCodeDragOver = (e, groupId, code) => {
        e.preventDefault();
        if (!dragCode || dragCode.code !== code.code) {
            setDragOverCode({ groupId, code: code.code });
        }
    };

    const handleCodeDrop = (e, targetGroupId, targetCode) => {
        e.preventDefault();
        if (dragCode) {
            setCptGroups(groups => {
                const newGroups = [...groups];
                const sourceGroup = newGroups.find(g => g.id === dragCode.groupId);
                const targetGroup = newGroups.find(g => g.id === targetGroupId);
                
                const draggedCode = sourceGroup.codes.find(c => c.code === dragCode.code);
                const sourceIndex = sourceGroup.codes.findIndex(c => c.code === dragCode.code);
                const targetIndex = targetGroup.codes.findIndex(c => c.code === targetCode.code);

                // Remove from source
                sourceGroup.codes.splice(sourceIndex, 1);
                
                // Add to target
                if (targetGroupId === dragCode.groupId) {
                    // Same group, just reorder
                    sourceGroup.codes.splice(targetIndex, 0, draggedCode);
                } else {
                    // Different group
                    targetGroup.codes.splice(targetIndex, 0, draggedCode);
                }

                return newGroups;
            });
        }
    };

    // Modified render for groups to include drag and drop
    const renderGroups = () => (
        cptGroups.map((group) => (
            <div 
                key={group.id} 
                className={`card mt-4 ${dragOverGroup === group.id ? 'border-2 border-primary' : ''}`}
                draggable="true"
                onDragStart={(e) => handleGroupDragStart(e, group.id)}
                onDragEnd={handleGroupDragEnd}
                onDragOver={(e) => handleGroupDragOver(e, group.id)}
                onDrop={(e) => handleGroupDrop(e, group.id)}
            >
                <div className="card-header cursor-move" style={{ background: 'var(--card-background)', borderBottom: '1px solid var(--border)' }}>
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
                            <h2 className="card-title" style={{ color: 'var(--text-primary)' }}>
                                ≡ {group.title}
                            </h2>
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
                            <div 
                                key={code.code}
                                className={`card cursor-move ${dragOverCode?.groupId === group.id && dragOverCode?.code === code.code ? 'border-2 border-primary' : ''}`}
                                draggable="true"
                                onDragStart={(e) => handleCodeDragStart(e, group.id, code)}
                                onDragEnd={handleCodeDragEnd}
                                onDragOver={(e) => handleCodeDragOver(e, group.id, code)}
                                onDrop={(e) => handleCodeDrop(e, group.id, code)}
                            >
                                <div className="p-4">
                                    <div className="flex justify-between">
                                        <div>
                                            <div className="font-bold">≡ {code.code}</div>
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
        ))
    );

    return (
        <div className="container">
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">wRVU Tracker</h1>
                </div>
                <div className="card-content">
                    {/* Previous date input and stats section remains the same */}
                    
                    {renderGroups()}

                    {/* Rest of the components (add new CPT, daily entries, etc.) remain the same */}
                </div>
            </div>
        </div>
    );
};
ReactDOM.render(<WRVUTracker />, document.getElementById('root'));
/* Add these styles to your existing CSS */

.cursor-move {
    cursor: move;
}

.border-primary {
    border-color: var(--primary) !important;
}

.border-2 {
    border-width: 2px !important;
}

/* Drag and drop visual feedback */
[draggable="true"] {
    transition: all 0.2s ease;
}

[draggable="true"]:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* Handle icon styles */
.card-title::before,
.font-bold::before {
    content: "≡";
    margin-right: 0.5rem;
    color: var(--text-secondary);
    cursor: move;
}
    );
};

ReactDOM.render(<WRVUTracker />, document.getElementById('root'));
