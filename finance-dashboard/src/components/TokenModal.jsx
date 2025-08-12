import React, { useState, useEffect } from 'react';

const Spinner = () => (
    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);

const TokenModal = ({ open, onClose, onSubmit, loading }) => {
    const [token, setToken] = useState('');
    const [show, setShow] = useState(open);

    // Mount/unmount for animation
    useEffect(() => {
        if (open) {
            setShow(true);
        } else {
            const timeout = setTimeout(() => setShow(false), 250);
            return () => clearTimeout(timeout);
        }
    }, [open]);

    // Reset token when modal opens
    useEffect(() => {
        if (open) setToken('');
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (token.trim()) {
            onSubmit(token.trim());
        }
    };

    if (!show) return null;

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
                open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            style={{ backdropFilter: 'blur(12px)' }}
        >
            <div
                className={`bg-[var(--card)] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-[var(--border)] flex flex-col items-center glass transform transition-all duration-300 ${
                    open ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-8 opacity-0'
                }`}
            >
                <h2 className="text-xl font-bold mb-2 text-[var(--text-accent)]">Paste Credit Karma Access Token</h2>
                <div className="text-sm text-[var(--text-secondary)] mb-4 text-center">
                    Paste your Credit Karma access token below.<br />
                    <a
                        href="https://www.creditkarma.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--accent)] underline hover:text-[var(--accent-steel-blue)] transition"
                    >
                        Go to Credit Karma
                    </a>
                </div>
                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
                    <textarea
                        className="w-full p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] text-[var(--text-primary)] mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                        rows={3}
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        placeholder="Paste token here..."
                        disabled={loading}
                        required
                    />
                    <div className="flex justify-end gap-2 w-full">
                        <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-[var(--surface-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] font-medium transition"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-xl font-bold shadow-md bg-gradient-to-br from-[var(--accent-steel-blue)] to-[var(--accent-soft-purple)] text-white tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] hover:scale-105 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={loading || !token.trim()}
                        >
                            {loading ? (
                                <>
                                    <Spinner />
                                    Refreshing...
                                </>
                            ) : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TokenModal;
