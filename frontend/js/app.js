(function() {
    // ---------- LOGIN with dynamic passwords ----------
    let validUsers = {
      chairman: { password: '34717215', role: 'Chairman' },
      secretary: { password: '34717215', role: 'Secretary' },
      treasurer: { password: '34717215', role: 'Treasurer' }
    };
    let currentUser = null;
    let currentRole = '';
    let currentPassword = '';
    const ADMIN_MEMBER_RESET_PASSWORD = '1234';

    const loginContainer = document.getElementById('loginContainer');
    const appWrapper = document.getElementById('appWrapper');
    const loginError = document.getElementById('loginError');
    const userBadge = document.getElementById('userBadge');
    const adminTabBtn = document.getElementById('adminTabBtn');
    const resetMembersBtn = document.getElementById('resetMembersBtn');

    document.getElementById('loginBtn').addEventListener('click', async function() {
      const username = document.getElementById('loginUser').value.trim().toLowerCase();
      const password = document.getElementById('loginPass').value.trim();

      if (!username || !password) {
        loginError.style.display = 'inline-block';
        loginError.textContent = 'Please enter both username and password.';
        return;
      }

      try {
        const authResponse = await requestJson('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        currentUser = authResponse.user;
        currentRole = authResponse.role;
        currentPassword = password;
        loginContainer.style.display = 'none';
        appWrapper.classList.add('active-app');
        userBadge.innerHTML = `<i class="fas fa-user-cog"></i> ${currentRole}`;
        loginError.style.display = 'none';

        if (currentRole === 'Chairman') {
          adminTabBtn.style.display = 'inline-flex';
          if (resetMembersBtn) resetMembersBtn.style.display = 'inline-flex';
          const resetHistoryBtn = document.getElementById('resetSavingsHistoryBtn');
          const resetSelectedMemberHistoryBtn = document.getElementById('resetSelectedMemberHistoryBtn');
          const historyResetMemberSelect = document.getElementById('historyResetMemberSelect');
          const resetBestSaverGroupBtn = document.getElementById('resetBestSaverGroupBtn');
          const resetBestSaverMemberBtn = document.getElementById('resetBestSaverMemberBtn');
          const bestSaverResetMemberSelect = document.getElementById('bestSaverResetMemberSelect');
          const resetSelectedMemberLoanHistoryBtn = document.getElementById('resetSelectedMemberLoanHistoryBtn');
          const loanHistoryResetMemberSelect = document.getElementById('loanHistoryResetMemberSelect');
          if (resetHistoryBtn) resetHistoryBtn.style.display = 'inline-flex';
          if (resetSelectedMemberHistoryBtn) resetSelectedMemberHistoryBtn.style.display = 'inline-flex';
          if (historyResetMemberSelect) historyResetMemberSelect.style.display = 'inline-flex';
          if (resetBestSaverGroupBtn) resetBestSaverGroupBtn.style.display = 'inline-flex';
          if (resetBestSaverMemberBtn) resetBestSaverMemberBtn.style.display = 'inline-flex';
          if (bestSaverResetMemberSelect) bestSaverResetMemberSelect.style.display = 'inline-flex';
          if (resetSelectedMemberLoanHistoryBtn) resetSelectedMemberLoanHistoryBtn.style.display = 'inline-flex';
          if (loanHistoryResetMemberSelect) loanHistoryResetMemberSelect.style.display = 'inline-flex';
        } else {
          adminTabBtn.style.display = 'none';
          if (resetMembersBtn) resetMembersBtn.style.display = 'none';
          const resetHistoryBtn = document.getElementById('resetSavingsHistoryBtn');
          const resetSelectedMemberHistoryBtn = document.getElementById('resetSelectedMemberHistoryBtn');
          const historyResetMemberSelect = document.getElementById('historyResetMemberSelect');
          const resetBestSaverGroupBtn = document.getElementById('resetBestSaverGroupBtn');
          const resetBestSaverMemberBtn = document.getElementById('resetBestSaverMemberBtn');
          const bestSaverResetMemberSelect = document.getElementById('bestSaverResetMemberSelect');
          const resetSelectedMemberLoanHistoryBtn = document.getElementById('resetSelectedMemberLoanHistoryBtn');
          const loanHistoryResetMemberSelect = document.getElementById('loanHistoryResetMemberSelect');
          if (resetHistoryBtn) resetHistoryBtn.style.display = 'none';
          if (resetSelectedMemberHistoryBtn) resetSelectedMemberHistoryBtn.style.display = 'none';
          if (historyResetMemberSelect) historyResetMemberSelect.style.display = 'none';
          if (resetBestSaverGroupBtn) resetBestSaverGroupBtn.style.display = 'none';
          if (resetBestSaverMemberBtn) resetBestSaverMemberBtn.style.display = 'none';
          if (bestSaverResetMemberSelect) bestSaverResetMemberSelect.style.display = 'none';
          if (resetSelectedMemberLoanHistoryBtn) resetSelectedMemberLoanHistoryBtn.style.display = 'none';
          if (loanHistoryResetMemberSelect) loanHistoryResetMemberSelect.style.display = 'none';
        }

        renderAll();
      } catch (error) {
        loginError.style.display = 'inline-block';
        loginError.textContent = error.message || 'Invalid credentials.';
      }
    });

    document.getElementById('logoutBtn').addEventListener('click', function() {
      loginContainer.style.display = 'block';
      appWrapper.classList.remove('active-app');
      currentUser = null;
      currentRole = '';
      currentPassword = '';
      document.getElementById('loginUser').value = '';
      document.getElementById('loginPass').value = '';
      loginError.style.display = 'none';
      adminTabBtn.style.display = 'none';
      if (resetMembersBtn) resetMembersBtn.style.display = 'none';
      const resetHistoryBtn = document.getElementById('resetSavingsHistoryBtn');
      const resetSelectedMemberHistoryBtn = document.getElementById('resetSelectedMemberHistoryBtn');
      const historyResetMemberSelect = document.getElementById('historyResetMemberSelect');
      const resetBestSaverGroupBtn = document.getElementById('resetBestSaverGroupBtn');
      const resetBestSaverMemberBtn = document.getElementById('resetBestSaverMemberBtn');
      const bestSaverResetMemberSelect = document.getElementById('bestSaverResetMemberSelect');
      if (resetHistoryBtn) resetHistoryBtn.style.display = 'none';
      if (resetSelectedMemberHistoryBtn) resetSelectedMemberHistoryBtn.style.display = 'none';
      if (historyResetMemberSelect) historyResetMemberSelect.style.display = 'none';
      if (resetBestSaverGroupBtn) resetBestSaverGroupBtn.style.display = 'none';
      if (resetBestSaverMemberBtn) resetBestSaverMemberBtn.style.display = 'none';
      if (bestSaverResetMemberSelect) bestSaverResetMemberSelect.style.display = 'none';
    });

    // ---------- ADMIN: CHANGE PASSWORDS ----------
    document.getElementById('adminChangePasswordBtn').addEventListener('click', async function() {
      const userSelect = document.getElementById('adminUserSelect').value;
      const newPass = document.getElementById('adminNewPassword').value.trim();
      const fb = document.getElementById('adminFeedback');
      if (!newPass || newPass.length < 4) {
        fb.textContent = 'Warning: Password must be at least 4 characters.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      try {
        await requestJson('/api/auth/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: userSelect, password: newPass })
        });
        validUsers[userSelect].password = newPass;
        fb.innerHTML = `<i class="fas fa-check-circle"></i> Success: Password for ${userSelect} changed in the database.`;
        fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
        document.getElementById('adminNewPassword').value = '';
      } catch (error) {
        fb.textContent = error.message || 'Warning: Password update failed.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
      }
    });

    // ---------- DATA ----------
    const STORAGE_KEY = 'kalapatan-state-v1';
    const STORAGE_BACKUP_KEY = 'kalapatan-state-v1-backup';
    const defaultMembers = [];

    function makeEmptySavingsHistory() {
      return {
        daily: { total: 0, entries: [] },
        weekly: { total: 0, entries: [] },
        monthly: { total: 0, entries: [] },
        annual: { total: 0, entries: [] }
      };
    }

    function makeEmptyBestSaverRankings() {
      return { week: [], month: [], year: [] };
    }

    function makeEmptyWithdrawalHistory() {
      return [];
    }

    function makeEmptyLoanRepaymentHistory() {
      return [];
    }

    function makeEmptyLoanRepaymentReportHistory() {
      return [];
    }

    function makeEmptyFormLibrary() {
      return [];
    }

    function normalizeBestSaverReportHistory(historyState) {
      if (!Array.isArray(historyState)) {
        return [];
      }

      return historyState
        .map((entry) => ({
          id: entry?.id || Date.now() + Math.random(),
          memberName: entry?.memberName || 'Member',
          memberReg: entry?.memberReg || 'KKSHG00',
          period: ['week', 'month', 'year'].includes(entry?.period) ? entry.period : 'month',
          periodLabel: entry?.periodLabel || 'Monthly',
          generatedAt: entry?.generatedAt || new Date().toISOString(),
          savingsCount: Number(entry?.savingsCount || 0),
          qualifyingAmount: Number(entry?.qualifyingAmount || 0)
        }))
        .slice(0, 12);
    }

    function normalizeWithdrawalHistory(historyState) {
      if (!Array.isArray(historyState)) {
        return makeEmptyWithdrawalHistory();
      }

      return historyState
        .map((entry) => ({
          id: entry?.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          memberId: entry?.memberId ?? entry?.member_id ?? null,
          memberName: entry?.memberName || entry?.member_name || 'Member',
          memberReg: entry?.memberReg || entry?.member_reg || 'KKSHG00',
          account: ['emergency', 'education', 'development', 'fixedDeposit'].includes(entry?.account) ? entry.account : 'emergency',
          accountLabel: entry?.accountLabel || 'Savings Account',
          amount: Number(entry?.amount || 0),
          balanceBefore: Number(entry?.balanceBefore ?? entry?.balance_before ?? 0),
          balanceAfter: Number(entry?.balanceAfter ?? entry?.balance_after ?? 0),
          timestamp: entry?.timestamp || entry?.dateTime || new Date().toISOString()
        }))
        .slice(0, 200);
    }

    function normalizeLoanRepaymentHistory(historyState) {
      if (!Array.isArray(historyState)) {
        return makeEmptyLoanRepaymentHistory();
      }

      return historyState
        .map((entry) => ({
          id: entry?.id || Date.now() + Math.random(),
          memberId: entry?.memberId ?? entry?.member_id ?? null,
          memberName: entry?.memberName || entry?.member_name || 'Member',
          memberReg: entry?.memberReg || entry?.registration_number || 'KKSHG00',
          amount: Number(entry?.amount || 0),
          paidOn: entry?.paidOn || entry?.paid_on || new Date().toISOString(),
          count: Number(entry?.count || 1)
        }))
        .slice(0, 500);
    }

    function normalizeLoanRepaymentReportHistory(historyState) {
      if (!Array.isArray(historyState)) {
        return makeEmptyLoanRepaymentReportHistory();
      }

      return historyState
        .map((entry) => ({
          id: entry?.id || Date.now() + Math.random(),
          memberName: entry?.memberName || 'Member',
          memberReg: entry?.memberReg || 'KKSHG00',
          period: entry?.period || 'week',
          periodLabel: entry?.periodLabel || 'Weekly',
          generatedAt: entry?.generatedAt || new Date().toISOString(),
          totalRepaymentAmount: Number(entry?.totalRepaymentAmount || 0),
          repaymentCount: Number(entry?.repaymentCount || 0)
        }))
        .slice(0, 12);
    }

    function normalizeSavingsHistory(historyState) {
      const emptyHistory = makeEmptySavingsHistory();
      if (!historyState || typeof historyState !== 'object') {
        return emptyHistory;
      }

      return {
        daily: {
          total: Number(historyState?.daily?.total || 0),
          entries: Array.isArray(historyState?.daily?.entries) ? historyState.daily.entries : []
        },
        weekly: {
          total: Number(historyState?.weekly?.total || 0),
          entries: Array.isArray(historyState?.weekly?.entries) ? historyState.weekly.entries : []
        },
        monthly: {
          total: Number(historyState?.monthly?.total || 0),
          entries: Array.isArray(historyState?.monthly?.entries) ? historyState.monthly.entries : []
        },
        annual: {
          total: Number(historyState?.annual?.total || 0),
          entries: Array.isArray(historyState?.annual?.entries) ? historyState.annual.entries : []
        }
      };
    }

    function loadState() {
      const storageCandidates = [
        { storage: localStorage, key: STORAGE_KEY },
        { storage: localStorage, key: STORAGE_BACKUP_KEY },
        { storage: sessionStorage, key: STORAGE_KEY },
        { storage: sessionStorage, key: STORAGE_BACKUP_KEY }
      ];

      for (const candidate of storageCandidates) {
        try {
          const raw = candidate.storage.getItem(candidate.key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            return {
              members: Array.isArray(parsed.members) ? parsed.members : null,
              chargesHistory: Array.isArray(parsed.chargesHistory) ? parsed.chargesHistory : [],
              savingsHistory: normalizeSavingsHistory(parsed.savingsHistory),
              bestSaverReportHistory: normalizeBestSaverReportHistory(parsed.bestSaverReportHistory),
              loanRepaymentHistory: normalizeLoanRepaymentHistory(parsed.loanRepaymentHistory),
              loanRepaymentReportHistory: normalizeLoanRepaymentReportHistory(parsed.loanRepaymentReportHistory),
              withdrawalHistory: normalizeWithdrawalHistory(parsed.withdrawalHistory),
              formLibrary: Array.isArray(parsed.formLibrary) ? parsed.formLibrary : makeEmptyFormLibrary()
            };
          }
        } catch (error) {
          console.warn(`Failed to load saved state from ${candidate.key}`, error);
        }
      }

      return { members: null, chargesHistory: [], savingsHistory: makeEmptySavingsHistory(), withdrawalHistory: makeEmptyWithdrawalHistory(), formLibrary: makeEmptyFormLibrary() };
    }

    function persistState() {
      const snapshot = {
        members,
        chargesHistory,
        savingsHistory,
        bestSaverReportHistory,
        loanRepaymentHistory,
        loanRepaymentReportHistory,
        withdrawalHistory,
        formLibrary,
        updatedAt: new Date().toISOString()
      };
      const payload = JSON.stringify(snapshot);
      const storageTargets = [
        { storage: localStorage, key: STORAGE_KEY },
        { storage: sessionStorage, key: STORAGE_KEY },
        { storage: localStorage, key: STORAGE_BACKUP_KEY },
        { storage: sessionStorage, key: STORAGE_BACKUP_KEY }
      ];

      storageTargets.forEach(({ storage, key }) => {
        try {
          storage.setItem(key, payload);
        } catch (error) {
          console.warn(`Failed to save state to ${key}`, error);
        }
      });
    }

    function normalizeMember(m) {
      const loans = Array.isArray(m.loans)
        ? m.loans.map((loan) => ({
            ...loan,
            id: loan?.id ?? loan?.loan_id ?? null,
            principal: Number(loan?.principal ?? loan?.amount ?? 0),
            amount: Number(loan?.amount ?? loan?.principal ?? 0),
            months: Number(loan?.months ?? 1),
            interestRate: Number(loan?.interestRate ?? loan?.interest_rate ?? 0),
            interest: Number(loan?.interest ?? 0),
            totalDue: Number(loan?.totalDue ?? loan?.total_due ?? loan?.amount ?? 0),
            status: String(loan?.status || 'active').toUpperCase(),
            dateIssued: loan?.dateIssued || loan?.issued_on || loan?.issued_at || loan?.created_at || new Date().toISOString()
          }))
        : [];

      return {
        ...m,
        name: m.name || m.full_name || 'Unnamed Member',
        reg: m.reg || `DB-${m.id || '0'}`,
        regFee: Number(m.regFee ?? m.registration_fee ?? 0),
        emergency: Number(m.emergency || 0),
        education: Number(m.education || 0),
        development: Number(m.development || 0),
        fixedDeposit: Number(m.fixedDeposit ?? m.fixed_deposit ?? 0),
        loanBalance: Number(m.loanBalance ?? m.loan_balance ?? 0),
        totalSavings: Number(m.totalSavings ?? (Number(m.emergency || 0) + Number(m.education || 0) + Number(m.development || 0) + Number(m.fixedDeposit ?? m.fixed_deposit ?? 0))),
        loans
      };
    }

    function normalizeFormLibrary(formEntries) {
      if (!Array.isArray(formEntries)) {
        return makeEmptyFormLibrary();
      }

      return formEntries
        .map((entry) => ({
          id: entry?.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: entry?.name || entry?.formName || 'Uploaded form',
          fileName: entry?.fileName || entry?.file_name || 'uploaded-form',
          sizeLabel: entry?.sizeLabel || entry?.size_label || '1 KB',
          dataUrl: entry?.dataUrl || entry?.data_url || ''
        }))
        .slice(0, 200);
    }

    const restoredState = loadState();
    let members = (restoredState.members && restoredState.members.length ? restoredState.members : defaultMembers).map(normalizeMember);
    let chargesHistory = Array.isArray(restoredState.chargesHistory) ? restoredState.chargesHistory : [];
    let savingsHistory = normalizeSavingsHistory(restoredState.savingsHistory);
    let bestSaverRankings = makeEmptyBestSaverRankings();
    let bestSaverReportHistory = normalizeBestSaverReportHistory(restoredState.bestSaverReportHistory);
    let loanRepaymentHistory = normalizeLoanRepaymentHistory(restoredState.loanRepaymentHistory);
    let loanRepaymentReportHistory = normalizeLoanRepaymentReportHistory(restoredState.loanRepaymentReportHistory);
    let withdrawalHistory = normalizeWithdrawalHistory(restoredState.withdrawalHistory);
    let formLibrary = Array.isArray(restoredState.formLibrary) ? restoredState.formLibrary : makeEmptyFormLibrary();

    function getNextRegistrationNumber(existingMembers = members) {
      const prefix = 'KKSHG';
      const numbers = existingMembers
        .map((member) => String(member?.reg || '').trim().toUpperCase())
        .filter((reg) => reg.startsWith(prefix))
        .map((reg) => Number(reg.slice(prefix.length)))
        .filter((value) => Number.isFinite(value));
      const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;
      return `${prefix}${nextNumber}`;
    }

    async function requestJson(path, options = {}) {
      const candidateUrls = [];
      if (path.startsWith('http://') || path.startsWith('https://')) {
        candidateUrls.push(path);
      } else {
        candidateUrls.push(path, `http://127.0.0.1:5000${path}`);
      }

      let lastError = new Error('Unable to reach the API.');
      for (const url of candidateUrls) {
        try {
          const response = await fetch(url, options);
          const text = await response.text();
          const trimmed = text.trim();
          const contentType = response.headers.get('content-type') || '';
          const looksLikeJson = trimmed.startsWith('{') || trimmed.startsWith('[');

          if (!trimmed) {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return null;
          }

          if (!looksLikeJson && !contentType.includes('application/json')) {
            throw new Error(trimmed.length > 140 ? `${trimmed.slice(0, 140)}...` : trimmed || `HTTP ${response.status}`);
          }

          const payload = JSON.parse(trimmed);
          if (!response.ok) {
            throw new Error(payload?.error || payload?.message || `HTTP ${response.status}`);
          }
          return payload;
        } catch (error) {
          lastError = error;
          console.warn(`Request to ${path} failed`, error);
        }
      }

      throw lastError;
    }

    function formatStatementTimestamp(value) {
      if (!value) return '—';
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return String(value);
      }
      return date.toLocaleString('en-KE');
    }

    function confirmAdminResetWithPassword(actionLabel, feedbackEl) {
      if (currentRole !== 'Chairman' || !currentUser || !validUsers[currentUser]) {
        if (feedbackEl) {
          feedbackEl.textContent = 'Admin reset denied: only the chairman can use this reset action.';
          feedbackEl.style.background = '#fde8e8';
          feedbackEl.style.color = '#a13d3d';
        }
        return false;
      }

      const enteredPassword = window.prompt(`Enter your current login password to confirm ${actionLabel}.`);
      if (enteredPassword === null) {
        return false;
      }

      if (String(enteredPassword) !== String(currentPassword || validUsers[currentUser].password)) {
        if (feedbackEl) {
          feedbackEl.textContent = 'Reset blocked: incorrect admin login password.';
          feedbackEl.style.background = '#fde8e8';
          feedbackEl.style.color = '#a13d3d';
        }
        return false;
      }

      return true;
    }

    function confirmAdminMemberClearWithPassword(actionLabel, feedbackEl) {
      if (currentRole !== 'Chairman' || !currentUser || !validUsers[currentUser]) {
        if (feedbackEl) {
          feedbackEl.textContent = 'Admin member clear denied: only the chairman can clear members.';
          feedbackEl.style.background = '#fde8e8';
          feedbackEl.style.color = '#a13d3d';
        }
        return false;
      }

      const enteredPassword = window.prompt(`Enter the reset password to confirm ${actionLabel}.`);
      if (enteredPassword === null) {
        return false;
      }

      if (String(enteredPassword) !== String(ADMIN_MEMBER_RESET_PASSWORD)) {
        if (feedbackEl) {
          feedbackEl.textContent = 'Member clear blocked: incorrect reset password.';
          feedbackEl.style.background = '#fde8e8';
          feedbackEl.style.color = '#a13d3d';
        }
        return false;
      }

      return true;
    }

    async function refreshMembersFromApi() {
      try {
        const [apiMembers, apiLoans] = await Promise.all([
          requestJson('/api/members'),
          requestJson('/api/loans')
        ]);

        if (Array.isArray(apiMembers)) {
          const loansByMember = new Map();
          if (Array.isArray(apiLoans)) {
            apiLoans.forEach((loan) => {
              const memberId = Number(loan?.member_id ?? loan?.memberId ?? 0);
              if (!memberId) {
                return;
              }
              const current = loansByMember.get(memberId) || [];
              current.push({
                ...loan,
                id: loan?.id ?? loan?.loan_id ?? null,
                principal: Number(loan?.amount ?? loan?.principal ?? 0),
                amount: Number(loan?.amount ?? loan?.principal ?? 0),
                months: Number(loan?.months ?? 1),
                interestRate: Number(loan?.interest_rate ?? loan?.interestRate ?? 0),
                interest: Number(loan?.interest ?? 0),
                totalDue: Number(loan?.total_due ?? loan?.totalDue ?? loan?.amount ?? 0),
                status: String(loan?.status || 'active').toUpperCase(),
                dateIssued: loan?.issued_on || loan?.issued_at || loan?.created_at || new Date().toISOString()
              });
              loansByMember.set(memberId, current);
            });
          }

          const mergedMembers = apiMembers.map((m) => {
            const existingMember = members.find((existing) => existing.id === m.id || existing.name === m.full_name || existing.reg === `DB-${m.id}`);
            const memberLoans = loansByMember.get(Number(m.id)) || existingMember?.loans || [];
            return normalizeMember({
              ...(existingMember || {}),
              id: m.id,
              name: m.full_name,
              reg: existingMember?.reg || m.registration_number || m.reg || `DB-${m.id}`,
              regFee: existingMember?.regFee ?? Number(m.registration_fee ?? 0),
              emergency: Number(m.emergency ?? existingMember?.emergency ?? 0),
              education: Number(m.education ?? existingMember?.education ?? 0),
              development: Number(m.development ?? existingMember?.development ?? 0),
              fixedDeposit: Number(m.fixed_deposit ?? m.fixedDeposit ?? existingMember?.fixedDeposit ?? 0),
              loanBalance: Number(m.loan_balance ?? m.loanBalance ?? existingMember?.loanBalance ?? 0),
              loans: memberLoans
            });
          });

          if (mergedMembers.length) {
            members = mergedMembers;
            persistState();
          }
        }
      } catch (error) {
        console.warn('Unable to load members from API; using local state.', error);
      }
      await refreshSavingsHistoryFromApi();
      await refreshBestSaverRankingsFromApi();
      await refreshFormLibraryFromApi();
      await refreshWithdrawalHistoryFromApi();
      renderAll();
    }

    async function refreshSavingsHistoryFromApi() {
      try {
        const historyPayload = await requestJson('/api/savings/history');
        if (historyPayload && typeof historyPayload === 'object') {
          savingsHistory = normalizeSavingsHistory(historyPayload);
          persistState();
        }
      } catch (error) {
        console.warn('Unable to load savings history from API; using local state.', error);
      }
    }

    function normalizeBestSaverRankings(payload) {
      const empty = makeEmptyBestSaverRankings();
      if (!payload || typeof payload !== 'object') return empty;
      return {
        week: Array.isArray(payload.week) ? payload.week.map((entry) => ({
          memberId: entry?.memberId,
          memberName: entry?.memberName || 'Unknown Member',
          savingsCount: Number(entry?.savingsCount || 0),
          qualifyingAmount: Number(entry?.qualifyingAmount || 0)
        })) : [],
        month: Array.isArray(payload.month) ? payload.month.map((entry) => ({
          memberId: entry?.memberId,
          memberName: entry?.memberName || 'Unknown Member',
          savingsCount: Number(entry?.savingsCount || 0),
          qualifyingAmount: Number(entry?.qualifyingAmount || 0)
        })) : [],
        year: Array.isArray(payload.year) ? payload.year.map((entry) => ({
          memberId: entry?.memberId,
          memberName: entry?.memberName || 'Unknown Member',
          savingsCount: Number(entry?.savingsCount || 0),
          qualifyingAmount: Number(entry?.qualifyingAmount || 0)
        })) : []
      };
    }

    async function refreshBestSaverRankingsFromApi() {
      try {
        const rankingsPayload = await requestJson('/api/savings/rankings');
        if (rankingsPayload && typeof rankingsPayload === 'object') {
          bestSaverRankings = normalizeBestSaverRankings(rankingsPayload);
        }
      } catch (error) {
        console.warn('Unable to load best saver rankings from API; using empty state.', error);
        bestSaverRankings = makeEmptyBestSaverRankings();
      }
    }

    async function refreshFormLibraryFromApi() {
      try {
        const payload = await requestJson('/api/forms');
        if (Array.isArray(payload)) {
          formLibrary = normalizeFormLibrary(payload);
          persistState();
        }
      } catch (error) {
        console.warn('Unable to load form library from API; using local state.', error);
      }
    }

    async function refreshWithdrawalHistoryFromApi() {
      try {
        const payload = await requestJson('/api/withdrawal-statements');
        if (Array.isArray(payload)) {
          withdrawalHistory = normalizeWithdrawalHistory(payload);
          persistState();
        }
      } catch (error) {
        console.warn('Unable to load withdrawal history from API; using local state.', error);
      }
    }

    // ---------- RENDER ----------
    function renderTable() {
      const tbody = document.getElementById('memberTableBody');
      let html = '';
      const sortedMembers = [...members].sort((a, b) => b.totalSavings - a.totalSavings);
      sortedMembers.forEach((m, displayIdx) => {
        const originalIdx = members.indexOf(m);
        const rowNum = displayIdx + 1;
        const isChairman = currentRole === 'Chairman';
        html += `<tr>
          <td>${rowNum}</td>
          <td class="member-name">${m.name}</td>
          <td><span class="reg-number">${m.reg}</span></td>
          <td><span class="fee-ok">Ksh ${m.regFee}/=</span></td>
          <td class="amount">${m.emergency > 0 ? `Ksh ${m.emergency}` : `<span class="empty-savings">0</span>`}</td>
          <td class="amount">${m.education > 0 ? `Ksh ${m.education}` : `<span class="empty-savings">0</span>`}</td>
          <td class="amount">${m.development > 0 ? `Ksh ${m.development}` : `<span class="empty-savings">0</span>`}</td>
          <td class="amount">${m.fixedDeposit > 0 ? `Ksh ${m.fixedDeposit}` : `<span class="empty-savings">0</span>`}</td>
          <td class="amount">${m.totalSavings > 0 ? `Ksh ${m.totalSavings}` : `<span class="empty-savings">0</span>`}</td>
          <td class="amount">${m.loanBalance > 0 ? `Ksh ${m.loanBalance}` : `<span class="empty-savings">0</span>`}</td>
          <td style="display: flex; gap: 0.4rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-info" onclick="generateMemberReport(${originalIdx})" style="font-size:0.8rem; padding:0.35rem 1rem;"><i class="fas fa-download"></i> Report</button>
            ${isChairman ? `<button class="btn" onclick="editMember(${originalIdx})" style="font-size:0.8rem; padding:0.35rem 1rem; background: #6b3f8a;"><i class="fas fa-edit"></i> Edit</button>
            <button class="btn btn-danger" onclick="deleteMember(${originalIdx})" style="font-size:0.8rem; padding:0.35rem 1rem;"><i class="fas fa-trash"></i> Delete</button>` : ''}
          </td>
        </tr>`;
      });
      tbody.innerHTML = html;
    }

    function updateSummary() {
      const totalMembers = members.length;
      const totalReg = members.reduce((s, m) => s + m.regFee, 0);
      const totalEmerg = members.reduce((s, m) => s + m.emergency, 0);
      const totalEdu = members.reduce((s, m) => s + m.education, 0);
      const totalDev = members.reduce((s, m) => s + m.development, 0);
      const totalFixed = members.reduce((s, m) => s + m.fixedDeposit, 0);
      const allAccounts = totalReg + totalEmerg + totalEdu + totalDev + totalFixed;
      document.getElementById('totalMembers').textContent = totalMembers;
      document.getElementById('totalRegFees').textContent = `Ksh ${totalReg.toLocaleString()}`;
      document.getElementById('totalEmergency').textContent = `Ksh ${totalEmerg.toLocaleString()}`;
      document.getElementById('totalEducation').textContent = `Ksh ${totalEdu.toLocaleString()}`;
      document.getElementById('totalFixed').textContent = `Ksh ${totalFixed}`;
      document.getElementById('totalDevelopment').textContent = `Ksh ${totalDev.toLocaleString()}`;
      document.getElementById('totalAll').textContent = `Ksh ${allAccounts.toLocaleString()}`;
    }

    function populateSelects() {
      const selects = ['loanMemberSelect', 'defaultMemberSelect', 'updateMemberSelect', 'repayMemberSelect', 'withdrawMemberSelect', 'chargeMemberSelect', 'historyResetMemberSelect', 'bestSaverResetMemberSelect', 'loanHistoryResetMemberSelect', 'statementMemberSelect'];
      selects.forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        sel.innerHTML = '';
        if (id === 'historyResetMemberSelect' || id === 'bestSaverResetMemberSelect' || id === 'loanHistoryResetMemberSelect') {
          const allOption = document.createElement('option');
          allOption.value = 'all';
          allOption.textContent = 'All members';
          sel.appendChild(allOption);
        }
        members.forEach((m, idx) => {
          const opt = document.createElement('option');
          opt.value = (id === 'historyResetMemberSelect' || id === 'bestSaverResetMemberSelect' || id === 'loanHistoryResetMemberSelect') ? String(m.id || idx + 1) : idx;
          opt.textContent = `${m.name} (${m.reg})`;
          sel.appendChild(opt);
        });
      });
    }

    function renderAll() {
      renderTable();
      updateSummary();
      populateSelects();
      renderChargesHistory();
      renderSavingsHistoryDashboard();
      renderBestSaverLeaderboard();
      renderBestSaverReportHistory();
      renderLoanRepaymentReportPage();
      renderWithdrawalHistory();
      renderFormLibraryLists();
    }

    function renderFormLibraryLists() {
      const adminList = document.getElementById('adminUploadedFormList');
      const downloadList = document.getElementById('downloadableFormList');
      const forms = Array.isArray(formLibrary) ? formLibrary : [];
      const isAdmin = currentRole === 'Chairman';

      const createCard = (item) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-library-item';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'space-between';
        wrapper.style.gap = '1rem';
        wrapper.style.padding = '0.9rem 1rem';
        wrapper.style.borderRadius = '20px';
        wrapper.style.background = '#fff';
        wrapper.style.border = '1px solid #dce8f0';
        wrapper.style.marginTop = '0.75rem';

        const info = document.createElement('div');
        const name = document.createElement('strong');
        name.textContent = item.name;
        const details = document.createElement('div');
        details.style.color = '#1f4b63';
        details.style.fontSize = '0.9rem';
        details.textContent = `${item.fileName || 'Uploaded form'} · ${item.sizeLabel || 'unknown size'}`;
        info.appendChild(name);
        info.appendChild(details);

        const actionGroup = document.createElement('div');
        actionGroup.style.display = 'flex';
        actionGroup.style.gap = '0.5rem';
        actionGroup.style.flexWrap = 'wrap';

        const downloadAction = document.createElement('button');
        downloadAction.className = 'btn btn-info';
        downloadAction.type = 'button';
        downloadAction.textContent = 'Download';
        downloadAction.addEventListener('click', function() {
          const anchor = document.createElement('a');
          anchor.href = item.dataUrl;
          anchor.download = item.fileName || item.name;
          anchor.click();
        });
        actionGroup.appendChild(downloadAction);

        if (isAdmin) {
          const deleteAction = document.createElement('button');
          deleteAction.className = 'btn btn-danger';
          deleteAction.type = 'button';
          deleteAction.textContent = 'Delete';
          deleteAction.addEventListener('click', async function() {
            const deleteTarget = item?.name || item?.fileName || 'this form';
            if (!confirm(`Delete ${deleteTarget} from the form library?`)) return;
            try {
              await requestJson(`/api/forms/${item.id}`, { method: 'DELETE' });
            } catch (error) {
              console.warn('Unable to remove form from API; falling back to local state.', error);
            }
            formLibrary = formLibrary.filter((entry) => entry.id !== item.id);
            persistState();
            renderAll();
          });
          actionGroup.appendChild(deleteAction);
        }

        wrapper.appendChild(info);
        wrapper.appendChild(actionGroup);
        return wrapper;
      };

      const emptyAdminMessage = '<div class="feedback-badge" style="background:#eef5fa; color:#1d4a63;">No forms uploaded yet.</div>';
      const emptyDownloadMessage = '<div class="feedback-badge" style="background:#eef5fa; color:#1d4a63;">No forms are available for download.</div>';

      if (adminList) {
        adminList.innerHTML = '';
        if (!forms.length) {
          adminList.innerHTML = emptyAdminMessage;
        } else {
          forms.forEach((item) => adminList.appendChild(createCard(item)));
        }
      }

      if (downloadList) {
        downloadList.innerHTML = '';
        if (!forms.length) {
          downloadList.innerHTML = emptyDownloadMessage;
        } else {
          forms.forEach((item) => downloadList.appendChild(createCard(item)));
        }
      }
    }

    function formatReportDate(date = new Date()) {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
    }

    function addDateStamp(doc, { x, y, width = 64, height = 32, dateText = formatReportDate(), centered = false, margin = 12, placement = 'bottom-right' } = {}, onComplete) {
      const stampCandidates = ['assets/Stamp.png', 'assets/stamp.PNG', 'assets/Stamp.PNG', 'assets/stamp.png'];
      let attempt = 0;
      const stampImg = new Image();

      const tryLoad = () => {
        if (attempt >= stampCandidates.length) {
          if (typeof onComplete === 'function') onComplete();
          return;
        }

        stampImg.onload = function() {
          try {
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const maxWidth = Math.min(width, pageWidth - margin * 2);
            const maxHeight = Math.min(height, pageHeight - margin * 2);
            const aspectRatio = stampImg.width / stampImg.height;
            let stampWidth = maxWidth;
            let stampHeight = maxWidth / aspectRatio;
            if (stampHeight > maxHeight) {
              stampHeight = maxHeight;
              stampWidth = stampHeight * aspectRatio;
            }
            const useBottomRight = placement === 'bottom-right';
            const baseX = centered ? (pageWidth - stampWidth) / 2 : useBottomRight ? pageWidth - stampWidth - margin : x + (width - stampWidth) / 2;
            const baseY = centered ? (pageHeight - stampHeight) / 2 : useBottomRight ? pageHeight - stampHeight - margin : y + (height - stampHeight) / 2;
            const stampX = Math.min(Math.max(baseX, margin), pageWidth - stampWidth - margin);
            const stampY = Math.min(Math.max(baseY, margin), pageHeight - stampHeight - margin);

            doc.addImage(stampImg, 'PNG', stampX, stampY, stampWidth, stampHeight);
            doc.setFontSize(8.0);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(220, 0, 0);
            const textX = centered ? pageWidth / 2 : useBottomRight ? stampX + stampWidth / 2 : x + width / 2;
            const textY = centered ? pageHeight / 2 + 2.2 : useBottomRight ? stampY + stampHeight / 2 + 1.5 : y + height / 2 + 2.2;
            doc.text(dateText, textX, textY, { align: 'center' });
          } catch (error) {
            console.warn('Could not add report stamp.', error);
          }
          if (typeof onComplete === 'function') onComplete();
        };

        stampImg.onerror = function() {
          attempt += 1;
          tryLoad();
        };

        stampImg.src = stampCandidates[attempt];
      };

      tryLoad();
    }

    // ---------- REGISTER ----------
    if (resetMembersBtn) {
      resetMembersBtn.addEventListener('click', async function() {
        const fb = document.getElementById('regFeedback');
        if (!confirmAdminMemberClearWithPassword('clearing all members', fb)) {
          return;
        }
        try {
          const response = await requestJson('/api/members/reset', { method: 'DELETE' });
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_BACKUP_KEY);
          sessionStorage.removeItem(STORAGE_KEY);
          sessionStorage.removeItem(STORAGE_BACKUP_KEY);
          members = [];
          chargesHistory = [];
          persistState();
          await refreshMembersFromApi();
          fb.textContent = response?.message || 'All members and related data cleared.';
          fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
        } catch (error) {
          fb.textContent = `Error: ${error.message}`;
          fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        }
      });
    }

    document.getElementById('registerMemberBtn').addEventListener('click', async function() {
      const name = document.getElementById('memberName').value.trim();
      const regInput = document.getElementById('memberReg').value.trim().toUpperCase();
      const regFee = parseFloat(document.getElementById('memberRegFee').value) || 0;
      const fb = document.getElementById('regFeedback');
      if (!name) {
        fb.textContent = 'Warning: Name required.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }

      const reg = regInput || getNextRegistrationNumber(members);
      if (!/^KKSHG\d+$/.test(reg)) {
        fb.textContent = 'Warning: Registration number must use KKSHG1 format.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      if (members.some(m => m.reg.toUpperCase() === reg)) {
        fb.textContent = 'Warning: Registration number already exists.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }

      try {
        const data = await requestJson('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: name,
            registration_number: reg,
            registration_fee: regFee,
            phone: '',
            email: `${name.toLowerCase().replace(/\s+/g, '.')}@kalapatan.local`,
            role: 'member',
            joined_on: new Date().toISOString().slice(0, 10)
          })
        });

        persistState();
        await refreshMembersFromApi();
        fb.textContent = `Success: ${name} registered as ${data?.registration_number || reg}.`;
        fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
        document.getElementById('memberName').value = '';
        document.getElementById('memberReg').value = '';
        document.getElementById('memberRegFee').value = '200';
      } catch (error) {
        fb.textContent = `Error: ${error.message}`;
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
      }
    });

    // ---------- LOAN ----------
    document.getElementById('applyLoanBtn').addEventListener('click', async function() {
      const select = document.getElementById('loanMemberSelect');
      const idx = parseInt(select.value, 10);
      const fb = document.getElementById('loanFeedback');
      if (isNaN(idx) || idx < 0 || idx >= members.length) {
        fb.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Select a valid member.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      const principal = parseFloat(document.getElementById('loanPrincipal').value);
      const months = parseInt(document.getElementById('loanMonths').value, 10);
      const interestRate = parseFloat(document.getElementById('loanInterestRate').value);
      if (isNaN(principal) || principal < 100 || isNaN(months) || months < 1 || isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
        fb.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Principal >=100 Ksh, months >=1, interest rate 0-100%.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      let member = members[idx];
      if (!member?.id) {
        await refreshMembersFromApi();
        member = members[idx];
      }
      if (!member?.id) {
        fb.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Unable to resolve a valid member ID for this loan request.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      const interest = principal * (interestRate / 100) * months;
      const totalDue = principal + interest;
      try {
        const loanResponse = await requestJson('/api/loans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ member_id: Number(member.id), amount: principal, interest_rate: interestRate, status: 'active' })
        });

        member.loanBalance = (member.loanBalance || 0) + totalDue;
        member.loans = member.loans || [];
        member.loans.push({
          id: loanResponse?.id || null,
          principal, months, interestRate, interest, totalDue,
          dateIssued: new Date().toLocaleDateString(),
          repaid: 0, status: 'ACTIVE'
        });
        fb.innerHTML = `<i class="fas fa-check-circle"></i> Loan for ${member.name}: principal Ksh ${principal}, interest ${months}mo @${interestRate}% = Ksh ${interest.toFixed(0)}. Total due: Ksh ${totalDue.toFixed(0)}. Saved to MySQL.`;
        fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
        document.getElementById('loanCalculationPreview').innerHTML = 
          `<i class="fas fa-chart-simple"></i> Interest: ${interestRate}% × ${months}mo = Ksh ${interest.toFixed(0)} · Total due: Ksh ${totalDue.toFixed(0)} (penalty only on default)`;
        persistState();
        await refreshMembersFromApi();
      } catch (error) {
        fb.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${error.message}`;
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
      }
    });

    // ---------- DEFAULT ----------
    document.getElementById('applyDefaultBtn').addEventListener('click', function() {
      const select = document.getElementById('defaultMemberSelect');
      const idx = parseInt(select.value, 10);
      const fb = document.getElementById('defaultFeedback');
      if (isNaN(idx) || idx < 0 || idx >= members.length) {
        fb.textContent = 'Warning: Select a valid member.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      const member = members[idx];
      if (member.loanBalance <= 0) {
        fb.textContent = `Info: ${member.name} has no outstanding loan to apply penalty.`;
        fb.style.background = '#fef3c7'; fb.style.color = '#92400e';
        return;
      }
      const penalty = member.loanBalance * 0.01;
      member.loanBalance = member.loanBalance + penalty;
      fb.textContent = `Warning: Default penalty applied: 1% = Ksh ${penalty.toFixed(0)} added to ${member.name}'s balance. New balance: Ksh ${member.loanBalance.toFixed(0)}.`;
      fb.style.background = '#fef3c7'; fb.style.color = '#92400e';
      persistState();
      renderAll();
    });

    // ---------- UPDATE ACCOUNTS ----------
    document.getElementById('updateAccountsBtn').addEventListener('click', async function() {
      const select = document.getElementById('updateMemberSelect');
      const idx = parseInt(select.value, 10);
      const fb = document.getElementById('updateFeedback');
      if (isNaN(idx) || idx < 0 || idx >= members.length) {
        fb.textContent = 'Warning: Select a valid member.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      let member = members[idx];
      if (!member?.id) {
        await refreshMembersFromApi();
        member = members[idx];
      }
      if (!member?.id) {
        fb.textContent = 'Warning: Unable to resolve a valid member ID for this savings update.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      const emergAdd = parseFloat(document.getElementById('updateEmergency').value) || 0;
      const eduAdd = parseFloat(document.getElementById('updateEducation').value) || 0;
      const devAdd = parseFloat(document.getElementById('updateDevelopment').value) || 0;
      const fixedAdd = parseFloat(document.getElementById('updateFixedDeposit').value) || 0;
      if (emergAdd < 0 || eduAdd < 0 || devAdd < 0 || fixedAdd < 0) {
        fb.textContent = 'Warning: Amounts cannot be negative.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      if (emergAdd === 0 && eduAdd === 0 && devAdd === 0 && fixedAdd === 0) {
        fb.textContent = 'Info: Enter at least one amount to add.';
        fb.style.background = '#fef3c7'; fb.style.color = '#92400e';
        return;
      }

      try {
        const data = await requestJson('/api/savings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: Number(member.id),
            amount: emergAdd + eduAdd + devAdd + fixedAdd,
            emergency: emergAdd,
            education: eduAdd,
            development: devAdd,
            fixed_deposit: fixedAdd,
            notes: 'Account update'
          })
        });

        member.emergency += emergAdd;
        member.education += eduAdd;
        member.development += devAdd;
        member.fixedDeposit = (member.fixedDeposit || 0) + fixedAdd;
        member.totalSavings = member.emergency + member.education + member.development + member.fixedDeposit;
        fb.textContent = `Success: ${member.name}: Emergency +Ksh ${emergAdd}, Education +Ksh ${eduAdd}, Development +Ksh ${devAdd}, Fixed Deposit +Ksh ${fixedAdd}. Total savings: Ksh ${member.totalSavings} saved to MySQL.`;
        fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
        document.getElementById('updateEmergency').value = '0';
        document.getElementById('updateEducation').value = '0';
        document.getElementById('updateDevelopment').value = '0';
        document.getElementById('updateFixedDeposit').value = '0';
        persistState();
        await refreshMembersFromApi();
        await refreshSavingsHistoryFromApi();
      } catch (error) {
        fb.textContent = `Error: ${error.message}`;
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
      }
    });

    // ---------- REPAYMENT ----------
    document.getElementById('repayMemberSelect').addEventListener('change', function() {
      const idx = parseInt(this.value, 10);
      if (!isNaN(idx) && idx >= 0 && idx < members.length) {
        document.getElementById('currentLoanDisplay').value = `Ksh ${members[idx].loanBalance.toFixed(2)}`;
      }
    });

    function setDefaultRepaymentDateTime() {
      const now = new Date();
      const dateValue = now.toISOString().slice(0, 10);
      const timeValue = now.toTimeString().slice(0, 5);
      const repaymentDate = document.getElementById('repaymentDate');
      const repaymentTime = document.getElementById('repaymentTime');
      if (repaymentDate) repaymentDate.value = dateValue;
      if (repaymentTime) repaymentTime.value = timeValue;
    }

    setDefaultRepaymentDateTime();

    document.getElementById('repayLoanBtn').addEventListener('click', async function() {
      const select = document.getElementById('repayMemberSelect');
      const idx = parseInt(select.value, 10);
      const fb = document.getElementById('repayFeedback');
      if (isNaN(idx) || idx < 0 || idx >= members.length) {
        fb.textContent = 'Warning: Select a valid member.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      const member = members[idx];
      const repayAmount = parseFloat(document.getElementById('repaymentAmount').value) || 0;
      if (repayAmount <= 0) {
        fb.textContent = 'Warning: Repayment amount must be greater than 0.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      if (member.loanBalance <= 0) {
        fb.textContent = `Info: ${member.name} has no outstanding loan.`;
        fb.style.background = '#fef3c7'; fb.style.color = '#92400e';
        return;
      }
      if (repayAmount > member.loanBalance) {
        fb.textContent = `Warning: Repayment cannot exceed outstanding balance (Ksh ${member.loanBalance.toFixed(2)}).`;
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }

      const activeLoan = member.loans && member.loans.length > 0
        ? member.loans.find((loan) => String(loan?.status || '').toUpperCase() === 'ACTIVE') || member.loans[member.loans.length - 1]
        : null;
      const loanId = activeLoan?.id || null;

      try {
        const paymentDateValue = document.getElementById('repaymentDate')?.value || new Date().toISOString().slice(0, 10);
        const paymentTimeValue = document.getElementById('repaymentTime')?.value || new Date().toTimeString().slice(0, 5);
        const repaymentPayload = {
          loan_id: loanId,
          member_id: member.id,
          amount: repayAmount,
          paid_on: paymentDateValue,
          payment_time: paymentTimeValue,
          paid_at: `${paymentDateValue}T${paymentTimeValue}`,
          notes: document.getElementById('repaymentNotes').value
        };
        await requestJson('/api/repayments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(repaymentPayload)
        });

        loanRepaymentHistory.unshift({
          id: Date.now(),
          memberId: member.id || idx + 1,
          memberName: member.name,
          memberReg: member.reg,
          amount: repayAmount,
          paidOn: new Date().toISOString(),
          count: 1
        });
        loanRepaymentHistory = normalizeLoanRepaymentHistory(loanRepaymentHistory);

        member.loanBalance = Math.max(member.loanBalance - repayAmount, 0);
        if (member.loans && member.loans.length > 0) {
          if (activeLoan.status === 'ACTIVE') {
            activeLoan.repaid = (activeLoan.repaid || 0) + repayAmount;
            if (member.loanBalance <= 0) activeLoan.status = 'SETTLED';
          }
        }
        fb.innerHTML = `<i class="fas fa-check-circle"></i> Success: Repayment of Ksh ${repayAmount.toFixed(2)} received from ${member.name} and saved to MySQL. New balance: Ksh ${member.loanBalance.toFixed(2)}.`;
        fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
        document.getElementById('currentLoanDisplay').value = `Ksh ${member.loanBalance.toFixed(2)}`;
        document.getElementById('repaymentAmount').value = '0';
        document.getElementById('repaymentNotes').value = '';
        persistState();
        renderLoanRepaymentReportPage();
        await refreshMembersFromApi();
      } catch (error) {
        fb.textContent = `Error: ${error.message}`;
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
      }
    });

    // ---------- REPAYMENT HISTORY ----------
    document.getElementById('viewRepaymentHistoryBtn').addEventListener('click', async function() {
      const select = document.getElementById('repayMemberSelect');
      const idx = parseInt(select.value, 10);
      if (isNaN(idx) || idx < 0 || idx >= members.length) {
        alert('Please select a member first');
        return;
      }
      const member = members[idx];
      const historySection = document.getElementById('memberRepaymentHistory');
      const historyTable = document.getElementById('memberRepaymentHistoryTable');
      
      try {
        const response = await fetch(`/api/repayments/history/${member.id}`);
        if (!response.ok) throw new Error('Failed to fetch repayment history');
        const repayments = await response.json();
        
        if (!repayments || repayments.length === 0) {
          historySection.style.display = 'block';
          historyTable.innerHTML = '<tr><td colspan="3" style="padding:1rem; text-align:center; color:#8aa1b5;">No repayments recorded yet</td></tr>';
          return;
        }

        let html = '';
        repayments.forEach((repay) => {
          const dateValue = repay.paid_at || repay.paid_on;
          const date = new Date(dateValue).toLocaleString('en-KE');
          const notes = repay.notes || '—';
          html += `<tr style="border-bottom:1px solid #dde7f1;">
            <td style="padding:0.7rem;">${date}</td>
            <td style="padding:0.7rem; font-weight:bold; color:#0b2a3b;">Ksh ${Number(repay.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            <td style="padding:0.7rem; color:#1f4b63;">${notes}</td>
          </tr>`;
        });
        historyTable.innerHTML = html;
        historySection.style.display = 'block';
      } catch (error) {
        alert(`Error fetching history: ${error.message}`);
      }
    });

    document.getElementById('resetRepaymentHistoryBtn').addEventListener('click', function() {
      const historySection = document.getElementById('memberRepaymentHistory');
      const historyTable = document.getElementById('memberRepaymentHistoryTable');
      const fb = document.getElementById('repayFeedback');
      historyTable.innerHTML = '';
      historySection.style.display = 'none';
      if (fb) {
        fb.textContent = 'Repayment history display reset.';
        fb.style.background = '#ddf0e5';
        fb.style.color = '#1a6e4a';
      }
    });

    // ---------- LOAN REPAYMENT STATEMENT ----------
    document.getElementById('viewStatementBtn').addEventListener('click', async function() {
      const select = document.getElementById('statementMemberSelect');
      const idx = parseInt(select.value, 10);
      if (isNaN(idx) || idx < 0 || idx >= members.length) {
        alert('Please select a member first');
        return;
      }
      const member = members[idx];
      const statementDisplay = document.getElementById('loanStatementDisplay');
      const fb = document.getElementById('statementFeedback');
      
      try {
        const response = await fetch(`/api/repayment-statements/member/${member.id}`);
        if (!response.ok) throw new Error('Failed to fetch statements');
        const statements = await response.json();
        
        if (!statements || statements.length === 0) {
          statementDisplay.innerHTML = `<p style="color:#8aa1b5;"><i class="fas fa-info-circle"></i> No loan statements available for this member</p>`;
          statementDisplay.style.display = 'block';
          return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:0.75rem;">';
        statements.forEach((stmt) => {
          const percentagePaid = stmt.total_due > 0 ? ((stmt.total_paid / stmt.total_due) * 100).toFixed(1) : 0;
          const paymentRows = Array.isArray(stmt.repayment_history) && stmt.repayment_history.length > 0
            ? stmt.repayment_history.map((payment) => {
                const paidOn = formatStatementTimestamp(payment.paid_at || payment.paid_on);
                return `<tr style="border-top:1px solid #dde7f1;">
                  <td style="padding:0.35rem 0.25rem; font-size:0.82rem;">${paidOn}</td>
                  <td style="padding:0.35rem 0.25rem; font-size:0.82rem; font-weight:bold;">Ksh ${Number(payment.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  <td style="padding:0.35rem 0.25rem; font-size:0.82rem;">Ksh ${Number(payment.balance_after_payment).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>`;
              }).join('')
            : '';

          html += `
            <div style="padding:0.85rem; border:1px solid #1f4b63; border-radius:8px; background:#fff;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
                <strong style="color:#0b2a3b;">Loan #${stmt.loan_id}</strong>
                <span style="padding:0.25rem 0.55rem; border-radius:999px; background:${stmt.balance_remaining > 0 ? '#fef3c7' : '#ddf0e5'}; color:${stmt.balance_remaining > 0 ? '#92400e' : '#1a6e4a'}; font-size:0.78rem; font-weight:bold;">
                  ${stmt.balance_remaining > 0 ? 'Active' : 'Settled'}
                </span>
              </div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.55rem; margin-bottom:0.5rem; font-size:0.84rem;">
                <div><small style="color:#678;">Issued</small><br><strong>${new Date(stmt.loan_issued_date).toLocaleDateString('en-KE')}</strong></div>
                <div><small style="color:#678;">Paid / Bal</small><br><strong>Ksh ${Number(stmt.total_paid).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} / Ksh ${Number(stmt.balance_remaining).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></div>
              </div>
              ${paymentRows ? `<table style="width:100%; border-collapse:collapse; margin-top:0.35rem;"><thead><tr style="background:#f0f6fb;"><th style="padding:0.35rem 0.25rem; text-align:left; font-size:0.78rem; color:#1f4b63;">Date</th><th style="padding:0.35rem 0.25rem; text-align:left; font-size:0.78rem; color:#1f4b63;">Paid</th><th style="padding:0.35rem 0.25rem; text-align:left; font-size:0.78rem; color:#1f4b63;">Bal</th></tr></thead><tbody>${paymentRows}</tbody></table>` : ''}
              <div style="margin-top:0.5rem; display:flex; align-items:center; gap:0.5rem; font-size:0.78rem; color:#678;">
                <div style="flex:1; height:7px; background:#dde7f1; border-radius:4px; overflow:hidden;">
                  <div style="height:100%; background:#1a6e4a; width:${percentagePaid}%;"></div>
                </div>
                <span>${percentagePaid}%</span>
              </div>
            </div>
          `;
        });
        html += '</div>';
        statementDisplay.innerHTML = html;
        statementDisplay.style.display = 'block';
        fb.textContent = `Loaded ${statements.length} loan statement(s) for ${member.name}`;
        fb.style.background = '#ddf0e5';
        fb.style.color = '#1a6e4a';
      } catch (error) {
        statementDisplay.innerHTML = `<p style="color:#c61f1f;"><i class="fas fa-exclamation-circle"></i> Error: ${error.message}</p>`;
        statementDisplay.style.display = 'block';
        fb.textContent = `Error: ${error.message}`;
        fb.style.background = '#fde8e8';
        fb.style.color = '#a13d3d';
      }
    });

    document.getElementById('generateStatementBtn').addEventListener('click', async function() {
      const select = document.getElementById('statementMemberSelect');
      const idx = parseInt(select.value, 10);
      if (isNaN(idx) || idx < 0 || idx >= members.length) {
        alert('Please select a member first');
        return;
      }
      const member = members[idx];
      const fb = document.getElementById('statementFeedback');

      try {
        const response = await fetch(`/api/repayment-statements/member/${member.id}`);
        if (!response.ok) throw new Error('Failed to fetch statements');
        const statements = await response.json();

        if (!statements || statements.length === 0) {
          fb.textContent = 'No loan statements available for this member';
          fb.style.background = '#fde8e8';
          fb.style.color = '#a13d3d';
          return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('portrait', 'mm', 'a4');

        doc.setFillColor(11, 42, 59);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('KALAPATAN KONYANGO SELF HELP GROUP', 105, 12, { align: 'center' });
        doc.setFontSize(10);
        doc.text('INDIVIDUAL LOAN STATEMENT', 105, 20, { align: 'center' });

        doc.setTextColor(11, 42, 59);
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Name: ${member.name}`, 15, 38);
        doc.text(`Reg: ${member.reg}`, 15, 43);
        doc.text(`ID: ${member.id}`, 15, 48);
        doc.text(`Printed: ${new Date().toLocaleString('en-GB')}`, 130, 48);

        let yPos = 58;
        statements.forEach((stmt) => {
          if (yPos > 230) {
            doc.addPage();
            yPos = 15;
          }

          doc.setFillColor(240, 246, 251);
          doc.rect(12, yPos, 186, 24, 'F');

          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text(`Loan #${stmt.loan_id}`, 16, yPos + 6);
          doc.setFont(undefined, 'normal');
          doc.text(`Issued ${new Date(stmt.loan_issued_date).toLocaleDateString('en-GB')}`, 16, yPos + 12);
          doc.text(`Paid Ksh ${Number(stmt.total_paid).toLocaleString()} | Bal Ksh ${Number(stmt.balance_remaining).toLocaleString()}`, 16, yPos + 18);
          doc.text(`Status: ${stmt.loan_status}`, 124, yPos + 18);

          const paymentHistory = Array.isArray(stmt.repayment_history) ? stmt.repayment_history : [];
          yPos += 30;

          if (paymentHistory.length > 0) {
            const headerY = yPos;
            doc.setFont(undefined, 'bold');
            doc.text('Date', 16, headerY);
            doc.text('Paid', 68, headerY);
            doc.text('Bal', 118, headerY);
            doc.setFont(undefined, 'normal');
            yPos += 5;

            paymentHistory.forEach((payment) => {
              if (yPos > 260) {
                doc.addPage();
                yPos = 15;
              }
              doc.text(formatStatementTimestamp(payment.paid_at || payment.paid_on), 16, yPos);
              doc.text(`Ksh ${Number(payment.amount).toLocaleString()}`, 68, yPos);
              doc.text(`Ksh ${Number(payment.balance_after_payment).toLocaleString()}`, 118, yPos);
              yPos += 5;
            });
          } else {
            doc.setFont(undefined, 'italic');
            doc.text('No individual payments saved for this loan.', 16, yPos + 5);
            yPos += 10;
          }

          yPos += 8;
        });

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('KALAPATAN KONYANGO SHG · Short statement summary', 105, 285, { align: 'center' });

        const fileName = `Loan_Statement_${member.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);

        fb.textContent = `PDF generated successfully for ${member.name}`;
        fb.style.background = '#ddf0e5';
        fb.style.color = '#1a6e4a';
      } catch (error) {
        fb.textContent = `Error: ${error.message}`;
        fb.style.background = '#fde8e8';
        fb.style.color = '#a13d3d';
      }
    });

    document.getElementById('resetStatementBtn').addEventListener('click', function() {
      const statementDisplay = document.getElementById('loanStatementDisplay');
      const fb = document.getElementById('statementFeedback');
      statementDisplay.innerHTML = '';
      statementDisplay.style.display = 'none';
      fb.textContent = 'Statement view has been reset.';
      fb.style.background = '#ddf0e5';
      fb.style.color = '#1a6e4a';
    });

    // ---------- WITHDRAWAL ----------
    document.getElementById('withdrawMemberSelect').addEventListener('change', updateAvailableBalance);
    document.getElementById('withdrawAccountSelect').addEventListener('change', updateAvailableBalance);

    function updateAvailableBalance() {
      const memberIdx = parseInt(document.getElementById('withdrawMemberSelect').value, 10);
      const account = document.getElementById('withdrawAccountSelect').value;
      if (isNaN(memberIdx) || memberIdx < 0 || memberIdx >= members.length) return;
      const member = members[memberIdx];
      let balance = 0;
      if (account === 'emergency') balance = member.emergency;
      else if (account === 'education') balance = member.education;
      else if (account === 'development') balance = member.development;
      else if (account === 'fixedDeposit') balance = member.fixedDeposit || 0;
      document.getElementById('availableBalanceDisplay').value = `Ksh ${balance}`;
    }

    document.getElementById('requestWithdrawalBtn').addEventListener('click', async function() {
      const memberIdx = parseInt(document.getElementById('withdrawMemberSelect').value, 10);
      const account = document.getElementById('withdrawAccountSelect').value;
      const amount = parseFloat(document.getElementById('withdrawalAmount').value) || 0;
      const fb = document.getElementById('withdrawalFeedback');
      if (isNaN(memberIdx) || memberIdx < 0 || memberIdx >= members.length) {
        fb.textContent = 'Warning: Select a valid member.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      if (amount <= 0) {
        fb.textContent = 'Warning: Withdrawal amount must be greater than 0.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      const member = members[memberIdx];
      let availableBalance = 0;
      if (account === 'emergency') availableBalance = member.emergency;
      else if (account === 'education') availableBalance = member.education;
      else if (account === 'development') availableBalance = member.development;
      else if (account === 'fixedDeposit') availableBalance = member.fixedDeposit || 0;
      if (amount > availableBalance) {
        fb.textContent = `Warning: Insufficient balance. Available: Ksh ${availableBalance}`;
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      const accountLabels = {
        emergency: 'Emergency Fund',
        education: 'Education Fund',
        development: 'Development Fund',
        fixedDeposit: 'Fixed Deposit'
      };
      const statementTimestamp = new Date().toISOString();

      if (account === 'emergency') member.emergency -= amount;
      else if (account === 'education') member.education -= amount;
      else if (account === 'development') member.development -= amount;
      else if (account === 'fixedDeposit') member.fixedDeposit = Math.max(0, (member.fixedDeposit || 0) - amount);
      member.totalSavings = member.emergency + member.education + member.development + member.fixedDeposit;

      const entry = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        memberId: member.id || memberIdx + 1,
        memberName: member.name,
        memberReg: member.reg,
        account,
        accountLabel: accountLabels[account] || account,
        amount,
        balanceBefore: availableBalance,
        balanceAfter: availableBalance - amount,
        timestamp: statementTimestamp
      };
      withdrawalHistory.unshift(entry);
      withdrawalHistory = normalizeWithdrawalHistory(withdrawalHistory);

      try {
        await requestJson('/api/withdrawal-statements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            member_id: entry.memberId,
            memberName: entry.memberName,
            memberReg: entry.memberReg,
            account: entry.account,
            accountLabel: entry.accountLabel,
            amount: entry.amount,
            balanceBefore: entry.balanceBefore,
            balanceAfter: entry.balanceAfter,
            timestamp: entry.timestamp
          })
        });
      } catch (error) {
        console.warn('Unable to save withdrawal statement to API; keeping local state.', error);
      }

      fb.innerHTML = `<i class="fas fa-check-circle"></i> Success: Withdrawal request approved: Ksh ${amount} from ${account} fund. New balance: Ksh ${availableBalance - amount}`;
      fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
      document.getElementById('withdrawalAmount').value = '0';
      updateAvailableBalance();
      persistState();
      renderAll();
    });

    const resetWithdrawalHistoryBtn = document.getElementById('resetWithdrawalHistoryBtn');
    if (resetWithdrawalHistoryBtn) {
      resetWithdrawalHistoryBtn.addEventListener('click', async function() {
        const fb = document.getElementById('withdrawalFeedback');
        if (!withdrawalHistory.length) {
          fb.textContent = 'No withdrawal statements are available to reset.';
          fb.style.background = '#fef3c7';
          fb.style.color = '#92400e';
          return;
        }

        if (!confirm('Clear the withdrawal statement history? This cannot be undone.')) {
          return;
        }

        try {
          await requestJson('/api/withdrawal-statements/reset', { method: 'DELETE' });
        } catch (error) {
          console.warn('Unable to clear withdrawal statements from API; falling back to local state.', error);
        }

        withdrawalHistory = makeEmptyWithdrawalHistory();
        persistState();
        renderAll();
        fb.textContent = 'Withdrawal statement history has been reset.';
        fb.style.background = '#ddf0e5';
        fb.style.color = '#1a6e4a';
      });
    }

    document.getElementById('exportWithdrawalStatementBtn').addEventListener('click', function() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const pdfFeedback = document.getElementById('withdrawalPdfFeedback');
      const entries = [...withdrawalHistory].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      if (!entries.length) {
        if (pdfFeedback) {
          pdfFeedback.textContent = 'No withdrawal statements are available for export yet.';
          pdfFeedback.style.background = '#fde8e8';
          pdfFeedback.style.color = '#a13d3d';
        }
        return;
      }

      doc.setFillColor(11, 42, 59);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('KALAPATAN KONYANGO SELF HELP GROUP', 105, 12, { align: 'center' });
      doc.setFontSize(12);
      doc.text('WITHDRAWAL STATEMENT HISTORY', 105, 20, { align: 'center' });

      doc.setTextColor(11, 42, 59);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('Generated: ' + new Date().toLocaleString(), 15, 40);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);

      const tableRows = entries.map((entry) => [
        entry.memberName || 'Member',
        entry.memberReg || '—',
        entry.accountLabel || entry.account || 'Savings account',
        `Ksh ${Number(entry.amount || 0).toLocaleString()}`,
        `Ksh ${Number(entry.balanceBefore || 0).toLocaleString()}`,
        `Ksh ${Number(entry.balanceAfter || 0).toLocaleString()}`,
        new Date(entry.timestamp || new Date().toISOString()).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      ]);

      doc.autoTable({
        head: [['Member Name', 'Reg No', 'Account', 'Amount', 'Balance Before', 'Balance After', 'Date & Time']],
        body: tableRows,
        startY: 48,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [11, 42, 59], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 34 },
          1: { cellWidth: 22 },
          2: { cellWidth: 28 },
          3: { cellWidth: 24 },
          4: { cellWidth: 24 },
          5: { cellWidth: 24 },
          6: { cellWidth: 38 }
        },
        margin: { left: 10, right: 10 },
        alternateRowStyles: { fillColor: [246, 250, 255] }
      });

      addDateStamp(doc, {
        x: 100,
        y: 245,
        width: 70,
        height: 36,
        margin: 8,
        placement: 'bottom-right',
        dateText: formatReportDate()
      }, function() {
        doc.save(`Withdrawal_Statements_${new Date().toISOString().slice(0, 10)}.pdf`);
        if (pdfFeedback) {
          pdfFeedback.textContent = `Exported ${entries.length} withdrawal statement(s) to PDF.`;
          pdfFeedback.style.background = '#ddf0e5';
          pdfFeedback.style.color = '#1a6e4a';
        }
      });
    });

    // ---------- CHARGES ----------
    function renderChargesHistory() {
      const historyDiv = document.getElementById('chargesHistory');
      if (chargesHistory.length === 0) {
        historyDiv.innerHTML = '<p style="color:#8aa1b5;">No charges recorded yet.</p>';
        return;
      }
      let html = '<ul style="list-style:none; padding:0; margin:0;">';
      chargesHistory.slice(-5).reverse().forEach((charge) => {
        html += `<li style="padding:0.4rem 0; border-bottom:1px solid #fde4b5; display:flex; justify-content:space-between; align-items:center;">
          <div><strong>${charge.memberName}</strong> - ${charge.type} (${charge.description})<br><small style="color:#7d6d3f;">${charge.date}</small></div>
          <div style="color:#d97706; font-weight:bold;">Ksh ${charge.amount}</div>
        </li>`;
      });
      html += '</ul>';
      historyDiv.innerHTML = html;
    }

    function renderWithdrawalHistory() {
      const historyDiv = document.getElementById('withdrawalHistory');
      if (!historyDiv) return;

      if (!withdrawalHistory.length) {
        historyDiv.innerHTML = '<p style="color:#8aa1b5; margin:0;">No withdrawal statements recorded yet.</p>';
        return;
      }

      const html = withdrawalHistory.slice(0, 8).map((entry) => {
        const accountLabel = entry.accountLabel || entry.account || 'Savings account';
        const memberName = entry.memberName || 'Member';
        const memberReg = entry.memberReg || '—';
        const timestamp = new Date(entry.timestamp || new Date().toISOString()).toLocaleString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return `
          <div style="padding:0.7rem 0.8rem; border:1px solid #dfe7ef; border-radius:12px; background:#fff; margin-bottom:0.6rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.6rem; flex-wrap:wrap;">
              <div>
                <strong style="color:#0b2a3b;">${memberName}</strong><br>
                <small style="color:#678;">Reg: ${memberReg} • ${accountLabel}</small>
              </div>
              <div style="font-weight:bold; color:#0b2a3b; text-align:right;">Ksh ${Number(entry.amount || 0).toLocaleString()}<br><small style="color:#678;">${timestamp}</small></div>
            </div>
          </div>`;
      }).join('');

      historyDiv.innerHTML = html;
    }

    function renderSavingsHistoryDashboard() {
      const dashboard = document.getElementById('savingsHistoryDashboard');
      if (!dashboard) return;
      const periods = [
        { key: 'daily', label: 'Daily', description: 'Today to date' },
        { key: 'weekly', label: 'Weekly', description: 'Current week' },
        { key: 'monthly', label: 'Monthly', description: 'Current month' },
        { key: 'annual', label: 'Annual', description: 'Current year' }
      ];

      const html = periods.map((period) => {
        const data = savingsHistory[period.key] || { total: 0, entries: [] };
        const topEntries = Array.isArray(data.entries) ? data.entries.slice(0, 4) : [];
        const rows = topEntries.length ? topEntries.map((entry) => `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; border-bottom:1px solid #dde7f1; padding:0.35rem 0;">
            <div>
              <strong>${entry.memberName || 'Member'}</strong><br>
              <small style="color:#678;">${entry.period || entry.date || '—'}</small>
            </div>
            <div style="font-weight:bold; color:#0b2a3b;">Ksh ${Number(entry.amount || 0).toLocaleString()}</div>
          </div>
        `).join('') : '<p style="color:#8aa1b5; margin:0;">No savings recorded yet.</p>';

        return `
          <div style="background:#fff; border:1px solid #dfe7ef; border-radius:16px; padding:0.9rem; box-shadow:0 8px 22px rgba(11,42,59,0.06); min-width:220px; flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
              <div>
                <strong style="color:#0b2a3b;">${period.label}</strong><br>
                <small style="color:#678;">${period.description}</small>
              </div>
              <div style="font-weight:bold; color:#0b2a3b;">Ksh ${Number(data.total || 0).toLocaleString()}</div>
            </div>
            <div>${rows}</div>
          </div>
        `;
      }).join('');

      dashboard.innerHTML = `<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:1rem;">${html}</div>`;
    }

    function renderBestSaverLeaderboard() {
      const leaderboard = document.getElementById('bestSaverLeaderboard');
      if (!leaderboard) return;
      const periodLabels = {
        week: 'This Week',
        month: 'This Month',
        year: 'This Year'
      };

      const cards = Object.entries(periodLabels).map(([periodKey, periodLabel]) => {
        const entries = Array.isArray(bestSaverRankings?.[periodKey]) ? bestSaverRankings[periodKey] : [];
        const rows = entries.length ? entries.slice(0, 3).map((entry, index) => `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; border-bottom:1px solid #dde7f1; padding:0.45rem 0;">
            <div>
              <strong>${index + 1}. ${entry.memberName || 'Member'}</strong><br>
              <small style="color:#678;">${entry.savingsCount || 0} successful savings of KSh 100+ · KSh ${Number(entry.qualifyingAmount || 0).toLocaleString()}</small>
            </div>
          </div>
        `).join('') : '<p style="color:#8aa1b5; margin:0;">No winner available yet.</p>';

        return `
          <div style="background:#fff; border:1px solid #dfe7ef; border-radius:16px; padding:0.9rem; box-shadow:0 8px 22px rgba(11,42,59,0.06); min-width:220px; flex:1;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8rem;">
              <div>
                <strong style="color:#0b2a3b;">${periodLabel}</strong><br>
                <small style="color:#678;">Frequency ranking (KSh 100+ entries)</small>
              </div>
            </div>
            <div>${rows}</div>
          </div>
        `;
      }).join('');

      leaderboard.innerHTML = cards;
    }

    function renderBestSaverReportHistory() {
      const historyContainer = document.getElementById('bestSaverReportHistory');
      if (!historyContainer) return;

      if (!bestSaverReportHistory.length) {
        historyContainer.innerHTML = '<p style="color:#8aa1b5; margin:0;">No saved best-saver report history yet.</p>';
        return;
      }

      historyContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.7rem;">
          <strong style="color:#0b2a3b;">Saved Best Saver Report History</strong>
          ${bestSaverReportHistory.slice(0, 6).map((entry) => `
            <div style="padding:0.7rem 0.8rem; border:1px solid #dfe7ef; border-radius:12px; background:#f7fbff;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                <div>
                  <strong>${entry.memberName || 'Member'}</strong><br>
                  <small style="color:#678;">${entry.periodLabel || 'Monthly'} • ${new Date(entry.generatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                </div>
                <div style="font-weight:bold; color:#0b2a3b;">${entry.savingsCount || 0} saves</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    function getCurrentWeekStart(date = new Date()) {
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      const day = normalizedDate.getDay() || 7;
      normalizedDate.setDate(normalizedDate.getDate() - day + 1);
      return normalizedDate;
    }

    function getWeeklyLoanRepaymentWinners() {
      const now = new Date();
      const weekStart = getCurrentWeekStart(now);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const currentWeekEntries = loanRepaymentHistory.filter((entry) => {
        const paidOn = new Date(entry.paidOn);
        if (Number.isNaN(paidOn.getTime())) return false;
        return paidOn >= weekStart && paidOn <= weekEnd;
      });

      const grouped = currentWeekEntries.reduce((acc, entry) => {
        const key = entry.memberId ?? entry.memberName;
        if (!acc[key]) {
          acc[key] = {
            memberId: entry.memberId,
            memberName: entry.memberName || 'Member',
            memberReg: entry.memberReg || 'KKSHG00',
            totalRepaymentAmount: 0,
            repaymentCount: 0,
          };
        }
        acc[key].totalRepaymentAmount += Number(entry.amount || 0);
        acc[key].repaymentCount += Number(entry.count || 1);
        return acc;
      }, {});

      return Object.values(grouped)
        .sort((a, b) => {
          if (b.totalRepaymentAmount !== a.totalRepaymentAmount) {
            return b.totalRepaymentAmount - a.totalRepaymentAmount;
          }
          if (b.repaymentCount !== a.repaymentCount) {
            return b.repaymentCount - a.repaymentCount;
          }
          return (a.memberName || '').localeCompare(b.memberName || '');
        });
    }

    function renderLoanRepaymentReportPage() {
      const leaderboard = document.getElementById('loanRepaymentReportLeaderboard');
      const historyContainer = document.getElementById('loanRepaymentReportHistory');
      if (!leaderboard || !historyContainer) return;

      const weeklyWinners = getWeeklyLoanRepaymentWinners();
      const winner = weeklyWinners[0] || null;

      leaderboard.innerHTML = winner ? `
        <div style="background:#fff; border:1px solid #dfe7ef; border-radius:16px; padding:1rem; box-shadow:0 8px 22px rgba(11,42,59,0.06);">
          <strong style="color:#0b2a3b;">Best Loan Repayer of the Week</strong><br>
          <div style="margin-top:0.7rem; color:#0b2a3b;">
            <div><strong>${winner.memberName || 'Member'}</strong></div>
            <small style="color:#678;">${winner.repaymentCount || 0} timely repayments • KSh ${Number(winner.totalRepaymentAmount || 0).toLocaleString()}</small>
          </div>
        </div>
      ` : '<p style="color:#8aa1b5; margin:0;">No loan repayment activity is available for this week yet.</p>';

      if (!loanRepaymentReportHistory.length) {
        historyContainer.innerHTML = '<p style="color:#8aa1b5; margin:0;">No saved loan repayment report history yet.</p>';
        return;
      }

      historyContainer.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:0.7rem;">
          <strong style="color:#0b2a3b;">Saved Loan Repayment Reports</strong>
          ${loanRepaymentReportHistory.slice(0, 6).map((entry) => `
            <div style="padding:0.7rem 0.8rem; border:1px solid #dfe7ef; border-radius:12px; background:#f7fbff;">
              <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
                <div>
                  <strong>${entry.memberName || 'Member'}</strong><br>
                  <small style="color:#678;">${entry.periodLabel || 'Weekly'} • ${new Date(entry.generatedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>
                </div>
                <div style="font-weight:bold; color:#0b2a3b;">Ksh ${Number(entry.totalRepaymentAmount || 0).toLocaleString()}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    window.generateLoanRepaymentReport = function() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const weeklyWinners = getWeeklyLoanRepaymentWinners();
      const winner = weeklyWinners[0] || null;
      const feedback = document.getElementById('loanRepaymentReportFeedback');

      if (!winner) {
        if (feedback) {
          feedback.textContent = 'No loan repayment activity has been recorded for this week yet.';
          feedback.style.background = '#fde8e8';
          feedback.style.color = '#a13d3d';
        }
        alert('No loan repayment activity is available for this week yet.');
        return;
      }

      const reportDate = formatReportDate();
      const totalRepaymentAmount = Number(winner.totalRepaymentAmount || 0);
      const repaymentCount = Number(winner.repaymentCount || 0);
      const winnerName = winner.memberName || 'Member';
      const winnerReg = winner.memberReg || 'KKSHG00';
      const weekRange = `${getCurrentWeekStart().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - ${new Date(getCurrentWeekStart().getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
      const fileName = `Loan_Repayment_Report_${winnerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.setFillColor(11, 42, 59);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('KALAPATAN KONYANGO SELF HELP GROUP', 105, 12, { align: 'center' });
      doc.setFontSize(12);
      doc.text('LOAN REPAYMENT REPORT', 105, 20, { align: 'center' });

      doc.setTextColor(11, 42, 59);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Akalapatan Konyango SHG,', 15, 38);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.text('P.O Box 108,', 15, 44);
      doc.text('Malakisi.', 15, 50);
      doc.text('Date: _____________', 15, 60);
      doc.text(`Dear ${winnerName},`, 15, 72);

      doc.setFont(undefined, 'bold');
      doc.setFontSize(12);
      doc.text('CONGRATULATIONS TO OUR TOP LOAN REPAYER – AKALAPATAN KONYANGO GROUP!', 15, 84, { maxWidth: 180 });

      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Best Loan Repayer of the Week', 15, 96);

      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      const letterLines = doc.splitTextToSize(
        `Congratulations, ${winnerName}, on being recognized as the Best Loan Repayer of the Week in the Akalapatan Konyango Group.\n\nYour commitment to honoring your financial obligations and repaying your loan on time has earned you this well-deserved recognition. By successfully repaying KSh ${Number(totalRepaymentAmount).toLocaleString()} through ${repaymentCount} timely repayments during ${weekRange}, you have demonstrated responsibility, integrity, and financial discipline.\n\nYour dedication serves as an excellent example to other members and contributes greatly to the growth and sustainability of our group. We appreciate your commitment and encourage you to continue maintaining this outstanding record.\n\nKeep up the excellent work and continue inspiring others through your financial responsibility.\n\nYours Faithfully,\n\nGroup Chairman\n\nConfirmed by Secretary – Lifa A. Betty\n\nConfirmed by Treasurer – Getrude Nambuya\n\nMember ID: ${winnerReg}`,
        180
      );
      doc.text(letterLines, 15, 104);

      addDateStamp(doc, {
        x: 100,
        y: 222,
        width: 70,
        height: 36,
        placement: 'bottom-right',
        margin: 8,
        dateText: reportDate
      }, function() {
        doc.save(fileName);

        loanRepaymentReportHistory.unshift({
          id: Date.now(),
          memberName: winnerName,
          memberReg: winnerReg,
          period: 'week',
          periodLabel: 'Weekly',
          generatedAt: new Date().toISOString(),
          totalRepaymentAmount,
          repaymentCount
        });
        loanRepaymentReportHistory = normalizeLoanRepaymentReportHistory(loanRepaymentReportHistory);
        persistState();
        renderLoanRepaymentReportPage();

        if (feedback) {
          feedback.textContent = `Saved weekly loan repayment report for ${winnerName}.`;
          feedback.style.background = '#ddf0e5';
          feedback.style.color = '#1a6e4a';
        }
      });
    };

    window.generateBestSaverReport = function() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('portrait', 'mm', 'a4');
      const periodSelect = document.getElementById('bestSaverReportPeriodSelect');
      const selectedPeriod = ['week', 'month', 'year'].includes(periodSelect?.value) ? periodSelect.value : 'month';
      const periodLabels = {
        week: 'Weekly',
        month: 'Monthly',
        year: 'Yearly'
      };
      const winner = bestSaverRankings?.[selectedPeriod]?.[0] || null;
      const member = winner ? members.find((entry) => entry.id === winner.memberId || entry.name === winner.memberName) : null;
      const winnerName = winner?.memberName || member?.name || 'Member';
      const winnerReg = member?.reg || 'KKSHG00';
      const qualifyingCount = Number(winner?.savingsCount || 0);
      const qualifyingAmount = Number(winner?.qualifyingAmount || 0);
      const totalSavings = Number(member?.totalSavings || 0);
      const periodLabel = periodLabels[selectedPeriod] || 'Monthly';
      const periodHeading = selectedPeriod === 'week'
        ? 'this week'
        : selectedPeriod === 'year'
          ? new Date().getFullYear().toString()
          : new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

      if (!winner) {
        const feedback = document.getElementById('bestSaverFeedback');
        if (feedback) {
          feedback.textContent = 'No best-saver rankings are available yet for the selected period.';
          feedback.style.background = '#fde8e8';
          feedback.style.color = '#a13d3d';
        }
        alert('No best-saver rankings are available yet.');
        return;
      }

      const reportDate = formatReportDate();
      const fileName = `Best_Saver_${periodLabel}_${winnerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

      doc.setFillColor(11, 42, 59);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('KALAPATAN KONYANGO SELF HELP GROUP', 105, 12, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`Best Saver of the ${periodLabel}`, 105, 20, { align: 'center' });

      doc.setTextColor(11, 42, 59);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('Akalapatan Konyango SHG,', 15, 38);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);
      doc.text('P.O Box 108,', 15, 44);
      doc.text('Malakisi.', 15, 50);
      doc.text(`Dear ${winnerName},`, 15, 64);

      const letterLines = doc.splitTextToSize(
        `Congratulations on being crowned the Best Saver of the ${periodLabel} in the Akalapatan Konyango Group!\n\nYour commitment to financial discipline has earned you this well-deserved recognition. In ${periodHeading}, you saved ${qualifyingCount} times with KSh ${qualifyingAmount} from qualifying savings entries of KSh 100 and above, and your total savings balance is KSh ${totalSavings}. Your consistency, dedication, and savings culture are inspiring to the entire group.\n\nKeep up the excellent work. We celebrate your achievement and encourage you to continue building a brighter financial future.\n\nYours Faithfully,\n\nGroup Chairman\nConfirmed by Secretary-Lifa A. Betty\nConfirmed by Treasurer-Getrude Nambuya\n\nMember ID: ${winnerReg}`,
        180
      );
      doc.text(letterLines, 15, 72);

      addDateStamp(doc, {
        x: 100,
        y: 222,
        width: 70,
        height: 36,
        placement: 'bottom-right',
        margin: 8,
        dateText: reportDate
      }, function() {
        doc.save(fileName);

        bestSaverReportHistory.unshift({
          id: Date.now(),
          memberName: winnerName,
          memberReg: winnerReg,
          period: selectedPeriod,
          periodLabel,
          generatedAt: new Date().toISOString(),
          savingsCount: qualifyingCount,
          qualifyingAmount: qualifyingAmount
        });
        bestSaverReportHistory = normalizeBestSaverReportHistory(bestSaverReportHistory);
        persistState();
        renderBestSaverReportHistory();

        const feedback = document.getElementById('bestSaverFeedback');
        if (feedback) {
          feedback.textContent = `Generated ${periodLabel.toLowerCase()} best-saver report for ${winnerName}.`;
          feedback.style.background = '#ddf0e5';
          feedback.style.color = '#1a6e4a';
        }
      });
    };

    document.getElementById('applyChargeBtn').addEventListener('click', function() {
      const memberIdx = parseInt(document.getElementById('chargeMemberSelect').value, 10);
      const chargeType = document.getElementById('chargeType').value;
      const chargeAmount = parseFloat(document.getElementById('chargeAmount').value) || 0;
      const chargeDesc = document.getElementById('chargeDescription').value.trim();
      const deductFrom = document.getElementById('chargeDeductFrom').value;
      const fb = document.getElementById('chargeFeedback');
      if (isNaN(memberIdx) || memberIdx < 0 || memberIdx >= members.length) {
        fb.textContent = 'Warning: Select a valid member.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      if (chargeAmount <= 0) {
        fb.textContent = 'Warning: Charge amount must be greater than 0.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      if (!chargeDesc) {
        fb.textContent = 'Warning: Please provide a charge description.';
        fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        return;
      }
      const member = members[memberIdx];
      const typeLabel = { transaction: 'Transaction Charge', penalty: 'Penalty', maintenance: 'Maintenance Fee', other: 'Other Charge' }[chargeType] || chargeType;
      if (deductFrom === 'emergency') member.emergency = Math.max(0, member.emergency - chargeAmount);
      else if (deductFrom === 'education') member.education = Math.max(0, member.education - chargeAmount);
      else if (deductFrom === 'development') member.development = Math.max(0, member.development - chargeAmount);
      else if (deductFrom === 'loan') member.loanBalance = (member.loanBalance || 0) + chargeAmount;
      member.totalSavings = member.emergency + member.education + member.development + member.fixedDeposit;
      chargesHistory.push({
        memberName: member.name, type: typeLabel, description: chargeDesc,
        amount: chargeAmount, deductFrom, date: new Date().toLocaleString()
      });
      fb.innerHTML = `<i class="fas fa-check-circle"></i> Success: Charge applied: Ksh ${chargeAmount} (${typeLabel}) to ${member.name}. Deducted from ${deductFrom}.`;
      fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
      document.getElementById('chargeAmount').value = '0';
      document.getElementById('chargeDescription').value = '';
      persistState();
      renderChargesHistory();
      renderAll();
    });

    // ---------- EXPORT CSV ----------
    document.getElementById('exportCsvBtn').addEventListener('click', function() {
      let csv = 'Name,Reg Number,Reg Fee,Emergency,Education,Development,Fixed Deposit,Total Savings,Loan Balance\n';
      const sortedMembers = [...members].sort((a, b) => b.totalSavings - a.totalSavings);
      sortedMembers.forEach(m => {
        csv += `${m.name},${m.reg},${m.regFee},${m.emergency},${m.education},${m.development},${m.fixedDeposit || 0},${m.totalSavings},${m.loanBalance}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Kalapatan_Report_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // ---------- EXPORT PDF ----------
    document.getElementById('exportPdfBtn').addEventListener('click', function() {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('landscape', 'mm', 'a4');
      doc.setFillColor(11, 42, 59);
      doc.circle(25, 18, 5, 'F');
      doc.setTextColor(246, 196, 69);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('K', 25, 20, { align: 'center' });
      doc.setTextColor(11, 42, 59);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Kalapatan · Konyango Self Help Group', 35, 18);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Report generated: ${new Date().toLocaleString()}`, 35, 24);
      const headers = ['#', 'Name', 'Reg', 'Reg Fee', 'Emergency', 'Education', 'Development', 'Fixed Deposit', 'Total Savings', 'Loan Balance'];
      const sortedMembers = [...members].sort((a, b) => b.totalSavings - a.totalSavings);
      const rows = sortedMembers.map((m, idx) => [
        idx+1, m.name, m.reg, `Ksh ${m.regFee}`, `Ksh ${m.emergency}`, `Ksh ${m.education}`, `Ksh ${m.development}`, `Ksh ${m.fixedDeposit}`, `Ksh ${m.totalSavings}`, `Ksh ${m.loanBalance}`
      ]);
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 32,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [11, 42, 59], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 35 },
          2: { cellWidth: 25 },
          3: { cellWidth: 20 },
          4: { cellWidth: 22 },
          5: { cellWidth: 22 },
          6: { cellWidth: 25 },
          7: { cellWidth: 24 },
          8: { cellWidth: 24 },
          9: { cellWidth: 24 },
          10: { cellWidth: 24 }
        }
      });
      const totalReg = members.reduce((s, m) => s + m.regFee, 0);
      const totalEmerg = members.reduce((s, m) => s + m.emergency, 0);
      const totalEdu = members.reduce((s, m) => s + m.education, 0);
      const totalDev = members.reduce((s, m) => s + m.development, 0);
      const totalFixed = members.reduce((s, m) => s + m.fixedDeposit, 0);
      const allAccounts = totalReg + totalEmerg + totalEdu + totalDev + totalFixed;
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.text(`SUMMARY: Total Members: ${members.length}`, 20, finalY);
      doc.text(`Registration Fees: Ksh ${totalReg}  |  Emergency: Ksh ${totalEmerg}  |  Education: Ksh ${totalEdu}  |  Development: Ksh ${totalDev}  |  Fixed Deposit: Ksh ${totalFixed}  |  ALL ACCOUNTS: Ksh ${allAccounts}`, 20, finalY + 7);
      addDateStamp(doc, {
        x: 210,
        y: 142,
        width: 70,
        height: 36,
        margin: 8,
        placement: 'bottom-right',
        dateText: formatReportDate()
      }, function() {
        doc.save(`Kalapatan_Report_${new Date().toISOString().slice(0,10)}.pdf`);
      });
    });

    // ---------- INDIVIDUAL MEMBER REPORT ----------
    window.generateMemberReport = function(memberIdx) {
      const { jsPDF } = window.jspdf;
      const member = members[memberIdx];
      if (!member) return;
      const doc = new jsPDF('portrait', 'mm', 'a4');
      doc.setFillColor(11, 42, 59);
      doc.rect(0, 0, 210, 30, 'F');
      const logoImg = new Image();
      logoImg.src = 'assets/kalapatan logo.PNG';
      logoImg.onload = function() {
        try { doc.addImage(logoImg, 'PNG', 10, 3, 15, 15); } catch (e) {}
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('KALAPATAN KONYANGO SELF HELP GROUP', 55, 12, { align: 'left' });
        doc.setFontSize(12);
        doc.text('Individual Member Report', 55, 20, { align: 'left' });
        doc.setTextColor(11, 42, 59);
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('MEMBER DETAILS', 15, 46);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Name: ${member.name}`, 15, 52);
        doc.text(`Registration Number: ${member.reg}`, 15, 57);
        doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 15, 62);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text('ACCOUNTS SUMMARY', 15, 72);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        const accountData = [
          ['Account Type', 'Balance (Ksh)'],
          ['Registration Fee', `${member.regFee}`],
          ['Emergency Fund', `${member.emergency}`],
          ['Education Fund', `${member.education}`],
          ['Development Fund', `${member.development}`],
          ['Fixed Deposit', `${member.fixedDeposit}`],
          ['TOTAL SAVINGS', `${member.totalSavings}`],
          ['Outstanding Loan Balance', `${member.loanBalance}`]
        ];
        doc.autoTable({
          head: [accountData[0]],
          body: accountData.slice(1),
          startY: 75,
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [11, 42, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
          columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 80, halign: 'right' } },
          margin: { left: 15, right: 15 }
        });
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Generated: ' + new Date().toLocaleString(), 15, pageHeight - 8);
        doc.text(`Report for ${member.reg}`, 15, pageHeight - 4);
        addDateStamp(doc, {
          x: 70,
          y: pageHeight - 56,
          width: 70,
          height: 36,
          margin: 8,
          placement: 'bottom-right',
          dateText: formatReportDate()
        }, function() {
          doc.save(`${member.reg}_Report_${new Date().toISOString().slice(0,10)}.pdf`);
        });
      };
    };

    // ---------- EDIT & DELETE ----------
    let currentEditIdx = null;
    window.editMember = function(idx) {
      currentEditIdx = idx;
      const member = members[idx];
      document.getElementById('editName').value = member.name;
      document.getElementById('editReg').value = member.reg;
      document.getElementById('editRegFee').value = member.regFee;
      document.getElementById('editEmergency').value = member.emergency;
      document.getElementById('editEducation').value = member.education;
      document.getElementById('editDevelopment').value = member.development;
      document.getElementById('editFixedDeposit').value = member.fixedDeposit || 0;
      document.getElementById('editModal').style.display = 'flex';
    };
    window.closeEditModal = function() {
      document.getElementById('editModal').style.display = 'none';
      currentEditIdx = null;
    };
    window.saveMemberEdit = async function() {
      if (currentEditIdx === null) return;
      const member = members[currentEditIdx];
      const newName = document.getElementById('editName').value.trim();
      const newRegFee = parseFloat(document.getElementById('editRegFee').value) || 0;
      const newEmergency = parseFloat(document.getElementById('editEmergency').value) || 0;
      const newEducation = parseFloat(document.getElementById('editEducation').value) || 0;
      const newDevelopment = parseFloat(document.getElementById('editDevelopment').value) || 0;
      const newFixedDeposit = parseFloat(document.getElementById('editFixedDeposit').value) || 0;
      if (!newName) { alert('Please enter a member name.'); return; }
      try {
        await requestJson(`/api/members/${member.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: newName,
            registration_fee: newRegFee,
            emergency: newEmergency,
            education: newEducation,
            development: newDevelopment,
            fixed_deposit: newFixedDeposit
          })
        });
        member.name = newName;
        member.regFee = newRegFee;
        member.emergency = newEmergency;
        member.education = newEducation;
        member.development = newDevelopment;
        member.fixedDeposit = newFixedDeposit;
        member.totalSavings = member.emergency + member.education + member.development + member.fixedDeposit;
        persistState();
        await refreshMembersFromApi();
        closeEditModal();
        alert(`Success: ${newName}'s details have been updated successfully.`);
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    };
    window.deleteMember = function(idx) {
      const member = members[idx];
      if (confirm(`Warning: Are you sure you want to delete ${member.name} (${member.reg})?\n\nThis action cannot be undone.`)) {
        members.splice(idx, 1);
        persistState();
        renderAll();
        alert(`Success: ${member.name} has been removed from the group.`);
      }
    };

    // ---------- PREVIEW ----------
    document.getElementById('loanPrincipal').addEventListener('input', updatePreview);
    document.getElementById('loanMonths').addEventListener('input', updatePreview);
    document.getElementById('loanInterestRate').addEventListener('input', updatePreview);
    function updatePreview() {
      const p = parseFloat(document.getElementById('loanPrincipal').value) || 0;
      const m = parseInt(document.getElementById('loanMonths').value, 10) || 0;
      const rate = parseFloat(document.getElementById('loanInterestRate').value) || 0;
      if (p >= 100 && m >= 1 && rate >= 0 && rate <= 100) {
        const interest = p * (rate / 100) * m;
        document.getElementById('loanCalculationPreview').innerHTML = 
          `<i class="fas fa-chart-simple"></i> Interest: ${rate}% × ${m}mo = Ksh ${interest.toFixed(0)} · Total due: Ksh ${(p+interest).toFixed(0)} (penalty only on default)`;
      } else {
        document.getElementById('loanCalculationPreview').innerHTML = 
          `<i class="fas fa-info-circle"></i> Enter principal (>=100), months and a valid interest rate.`;
      }
    }

    // ---------- TABS ----------
    const tabs = document.querySelectorAll('.nav-tabs button');
    const pages = {
      pageMembers: document.getElementById('pageMembers'),
      pageRegister: document.getElementById('pageRegister'),
      pageLoan: document.getElementById('pageLoan'),
      pageRepayment: document.getElementById('pageRepayment'),
      pageLoanRepaymentReport: document.getElementById('pageLoanRepaymentReport'),
      pageLoanRepaymentStatement: document.getElementById('pageLoanRepaymentStatement'),
      pageWithdrawal: document.getElementById('pageWithdrawal'),
      pageUpdate: document.getElementById('pageUpdate'),
      pageCharges: document.getElementById('pageCharges'),
      pageSavingsHistory: document.getElementById('pageSavingsHistory'),
      pageBestSaver: document.getElementById('pageBestSaver'),
      pageForms: document.getElementById('pageForms'),
      pageAdmin: document.getElementById('pageAdmin')
    };
    tabs.forEach(btn => {
      btn.addEventListener('click', function() {
        tabs.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        Object.keys(pages).forEach(key => pages[key].classList.remove('active-page'));
        const target = this.dataset.page;
        if (pages[target]) pages[target].classList.add('active-page');
      });
    });

    // ---------- ADMIN: FORM LIBRARY ----------
    const uploadFormBtn = document.getElementById('adminUploadFormBtn');
    const uploadFormInput = document.getElementById('adminFormUpload');
    const uploadFormName = document.getElementById('adminFormName');
    const formsPageUploadBtn = document.getElementById('formsPageUploadBtn');
    const formsPageUploadInput = document.getElementById('formsPageFormUpload');
    const formsPageUploadName = document.getElementById('formsPageFormName');

    async function handleFormUpload(fileInput, nameInput, feedbackNode) {
      const file = fileInput && fileInput.files && fileInput.files[0];
      const formName = (nameInput ? nameInput.value : '').trim();

      if (!file) {
        if (feedbackNode) {
          feedbackNode.textContent = 'Select a form file before uploading.';
          feedbackNode.style.background = '#fef3c7';
          feedbackNode.style.color = '#92400e';
        }
        return;
      }

      if (!formName) {
        if (feedbackNode) {
          feedbackNode.textContent = 'Please enter a form name.';
          feedbackNode.style.background = '#fef3c7';
          feedbackNode.style.color = '#92400e';
        }
        return;
      }

      const reader = new FileReader();
      reader.onload = async function() {
        const sizeLabel = `${Math.max(1, Math.round(file.size / 1024))} KB`;
        const payload = {
          name: formName,
          file_name: file.name,
          size_label: sizeLabel,
          data_url: reader.result
        };

        try {
          const createdForm = await requestJson('/api/forms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          formLibrary.unshift(normalizeFormLibrary([createdForm])[0]);
        } catch (error) {
          console.warn('Unable to save form to API; falling back to local storage.', error);
          formLibrary.unshift({
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: formName,
            fileName: file.name,
            sizeLabel,
            dataUrl: reader.result
          });
        }

        persistState();
        renderFormLibraryLists();
        if (fileInput) fileInput.value = '';
        if (nameInput) nameInput.value = '';
        if (feedbackNode) {
          feedbackNode.textContent = `Saved ${formName} for download.`;
          feedbackNode.style.background = '#ddf0e5';
          feedbackNode.style.color = '#1a6e4a';
        }
      };
      reader.onerror = function() {
        if (feedbackNode) {
          feedbackNode.textContent = 'Unable to read the selected file.';
          feedbackNode.style.background = '#fde8e8';
          feedbackNode.style.color = '#a13d3d';
        }
      };
      reader.readAsDataURL(file);
    }

    if (uploadFormBtn && uploadFormInput) {
      uploadFormBtn.addEventListener('click', function() {
        handleFormUpload(uploadFormInput, uploadFormName, document.getElementById('adminFormUploadFeedback'));
      });
    }

    if (formsPageUploadBtn && formsPageUploadInput) {
      formsPageUploadBtn.addEventListener('click', function() {
        handleFormUpload(formsPageUploadInput, formsPageUploadName, document.getElementById('formsPageUploadFeedback'));
      });
    }

    // ---------- ADMIN RESET HISTORY ----------
    const resetHistoryBtn = document.getElementById('resetSavingsHistoryBtn');
    if (resetHistoryBtn) {
      resetHistoryBtn.addEventListener('click', async function() {
        const fb = document.getElementById('historyDashboardFeedback');
        if (!confirmAdminResetWithPassword('Reset All Members Savings History', fb)) {
          return;
        }
        try {
          const response = await requestJson('/api/savings/history/reset', { method: 'DELETE' });
          savingsHistory = makeEmptySavingsHistory();
          persistState();
          renderSavingsHistoryDashboard();
          fb.textContent = response?.message || 'Savings history dashboard reset.';
          fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
        } catch (error) {
          fb.textContent = `Error: ${error.message}`;
          fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        }
      });
    }

    const resetSelectedMemberHistoryBtn = document.getElementById('resetSelectedMemberHistoryBtn');
    if (resetSelectedMemberHistoryBtn) {
      resetSelectedMemberHistoryBtn.addEventListener('click', async function() {
        const fb = document.getElementById('historyDashboardFeedback');
        const memberSelect = document.getElementById('historyResetMemberSelect');
        const selectedValue = memberSelect ? memberSelect.value : '';
        if (!selectedValue || selectedValue === 'all') {
          fb.textContent = 'Select a specific member before resetting just one member history.';
          fb.style.background = '#fef3c7'; fb.style.color = '#92400e';
          return;
        }
        if (!confirmAdminResetWithPassword('Reset Selected Member Savings History', fb)) {
          return;
        }

        try {
          const response = await requestJson(`/api/savings/history/${selectedValue}/reset`, { method: 'DELETE' });
          await refreshSavingsHistoryFromApi();
          renderSavingsHistoryDashboard();
          fb.textContent = response?.message || 'Selected member savings history reset.';
          fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
        } catch (error) {
          fb.textContent = `Error: ${error.message}`;
          fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        }
      });
    }

    const resetSelectedMemberLoanHistoryBtn = document.getElementById('resetSelectedMemberLoanHistoryBtn');
    if (resetSelectedMemberLoanHistoryBtn) {
      resetSelectedMemberLoanHistoryBtn.addEventListener('click', async function() {
        const fb = document.getElementById('loanHistoryResetFeedback');
        const memberSelect = document.getElementById('loanHistoryResetMemberSelect');
        const selectedValue = memberSelect ? memberSelect.value : '';
        if (!selectedValue) {
          fb.textContent = 'Select a member before clearing loan history.';
          fb.style.background = '#fef3c7'; fb.style.color = '#92400e';
          return;
        }
        if (!confirmAdminResetWithPassword(selectedValue === 'all' ? 'Reset All Members Loan History' : 'Reset Selected Member Loan History', fb)) {
          return;
        }

        try {
          const path = selectedValue === 'all'
            ? '/api/loans/history/reset'
            : `/api/loans/history/${selectedValue}/reset`;
          const response = await requestJson(path, { method: 'DELETE' });
          await refreshMembersFromApi();
          renderAll();
          fb.textContent = response?.message || (selectedValue === 'all'
            ? 'All loan history cleared.'
            : 'Selected member loan history cleared.');
          fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
        } catch (error) {
          fb.textContent = `Error: ${error.message}`;
          fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
        }
      });
    }

    const exportBestSaverReportBtn = document.getElementById('exportBestSaverReportBtn');
    if (exportBestSaverReportBtn) {
      exportBestSaverReportBtn.addEventListener('click', function() {
        window.generateBestSaverReport();
      });
    }

    const exportLoanRepaymentReportBtn = document.getElementById('exportLoanRepaymentReportBtn');
    if (exportLoanRepaymentReportBtn) {
      exportLoanRepaymentReportBtn.addEventListener('click', function() {
        window.generateLoanRepaymentReport();
      });
    }

    const resetLoanRepaymentReportBtn = document.getElementById('resetLoanRepaymentReportBtn');
    if (resetLoanRepaymentReportBtn) {
      resetLoanRepaymentReportBtn.addEventListener('click', function() {
        const fb = document.getElementById('loanRepaymentReportFeedback');
        loanRepaymentHistory = makeEmptyLoanRepaymentHistory();
        loanRepaymentReportHistory = makeEmptyLoanRepaymentReportHistory();
        persistState();
        renderLoanRepaymentReportPage();
        if (fb) {
          fb.textContent = 'Loan repayment history refreshed. You can start a new report from a clean slate.';
          fb.style.background = '#ddf0e5';
          fb.style.color = '#1a6e4a';
        }
      });
    }

    const resetBestSaverGroupBtn = document.getElementById('resetBestSaverGroupBtn');
    if (resetBestSaverGroupBtn) {
      resetBestSaverGroupBtn.addEventListener('click', async function() {
        const fb = document.getElementById('bestSaverFeedback');
        if (!confirmAdminResetWithPassword('Reset All Members Best Saver Rankings', fb)) {
          return;
        }
        try {
          const response = await requestJson('/api/savings/history/reset', { method: 'DELETE' });
          await refreshSavingsHistoryFromApi();
          await refreshBestSaverRankingsFromApi();
          renderAll();
          if (fb) {
            fb.textContent = response?.message || 'All savings history has been reset.';
            fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
          }
        } catch (error) {
          if (fb) {
            fb.textContent = `Error: ${error.message}`;
            fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
          }
        }
      });
    }

    const resetBestSaverMemberBtn = document.getElementById('resetBestSaverMemberBtn');
    if (resetBestSaverMemberBtn) {
      resetBestSaverMemberBtn.addEventListener('click', async function() {
        const fb = document.getElementById('bestSaverFeedback');
        const memberSelect = document.getElementById('bestSaverResetMemberSelect');
        const selectedValue = memberSelect ? memberSelect.value : '';
        if (!selectedValue || selectedValue === 'all') {
          if (fb) {
            fb.textContent = 'Select a specific member before resetting just one member history.';
            fb.style.background = '#fef3c7'; fb.style.color = '#92400e';
          }
          return;
        }
        if (!confirmAdminResetWithPassword('Reset Selected Member Best Saver History', fb)) {
          return;
        }

        try {
          const response = await requestJson(`/api/savings/history/${selectedValue}/reset`, { method: 'DELETE' });
          await refreshSavingsHistoryFromApi();
          await refreshBestSaverRankingsFromApi();
          renderAll();
          if (fb) {
            fb.textContent = response?.message || 'Selected member savings history reset.';
            fb.style.background = '#ddf0e5'; fb.style.color = '#1a6e4a';
          }
        } catch (error) {
          if (fb) {
            fb.textContent = `Error: ${error.message}`;
            fb.style.background = '#fde8e8'; fb.style.color = '#a13d3d';
          }
        }
      });
    }

    // ---------- INIT ----------
    renderAll();
    updatePreview();
    updateAvailableBalance();
    renderChargesHistory();
    persistState();
    refreshMembersFromApi();
    refreshBestSaverRankingsFromApi();

    window.addEventListener('beforeunload', persistState);
    window.addEventListener('pagehide', persistState);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'hidden') persistState();
    });
  })();


