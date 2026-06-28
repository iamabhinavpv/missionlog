(function(){
  var STORAGE_THEME = 'missionlog.theme';
  var STORAGE_HABITS = 'missionlog.habits';
  var STORAGE_COMPLETIONS = 'missionlog.completions';
  var STORAGE_ACTIVE = 'missionlog.activeHabit';

  var habits = loadHabits();
  var completions = loadCompletions();
  var activeHabitId = loadActiveHabit();
  var selectedDate = null;

  var today = new Date();
  today.setHours(0, 0, 0, 0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var weekdayNames = ['S','M','T','W','T','F','S'];

  var monthLabel = document.getElementById('month-label');
  var weekdaysEl = document.getElementById('weekdays');
  var gridEl = document.getElementById('grid');
  var streakEl = document.getElementById('streak');
  var selectedDateEl = document.getElementById('selected-date');
  var themeToggle = document.getElementById('theme-toggle');
  var habitForm = document.getElementById('habit-form');
  var habitInput = document.getElementById('habit-input');
  var habitList = document.getElementById('habit-list');
  var habitEmpty = document.getElementById('habit-empty');

  if (!monthLabel || !weekdaysEl || !gridEl || !streakEl || !selectedDateEl || !themeToggle || !habitForm || !habitInput || !habitList || !habitEmpty) {
    console.error('Required DOM elements not found.');
    return;
  }

  weekdayNames.forEach(function(d){
    var s = document.createElement('span');
    s.textContent = d;
    weekdaysEl.appendChild(s);
  });

  function loadHabits(){
    try {
      return JSON.parse(localStorage.getItem(STORAGE_HABITS)) || [];
    } catch (err) {
      return [];
    }
  }

  function loadCompletions(){
    try {
      return JSON.parse(localStorage.getItem(STORAGE_COMPLETIONS)) || {};
    } catch (err) {
      return {};
    }
  }

  function loadActiveHabit(){
    return localStorage.getItem(STORAGE_ACTIVE) || null;
  }

  function saveHabits(){
    localStorage.setItem(STORAGE_HABITS, JSON.stringify(habits));
  }

  function saveCompletions(){
    localStorage.setItem(STORAGE_COMPLETIONS, JSON.stringify(completions));
  }

  function saveActiveHabit(){
    localStorage.setItem(STORAGE_ACTIVE, activeHabitId || '');
  }

  function formatDateLabel(date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function key(d){
    return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
  }

  function getCompletion(dateKey, habitId){
    return completions[dateKey] && completions[dateKey][habitId];
  }

  function toggleCompletion(dateKey, habitId){
    if (!completions[dateKey]) {
      completions[dateKey] = {};
    }
    completions[dateKey][habitId] = !completions[dateKey][habitId];
    if (!completions[dateKey][habitId]) {
      delete completions[dateKey][habitId];
    }
    if (completions[dateKey] && Object.keys(completions[dateKey]).length === 0) {
      delete completions[dateKey];
    }
    saveCompletions();
  }

  function computeStreak(){
    var count = 0;
    var d = new Date(today);
    while (activeHabitId && getCompletion(key(d), activeHabitId)) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    streakEl.textContent = count;
  }

  function updateSelectedLabel(){
    var activeName = getActiveHabitName();
    if (selectedDate) {
      selectedDateEl.textContent = activeName
        ? activeName + ' • ' + formatDateLabel(selectedDate)
        : 'Select a habit and then choose a date.';
    } else {
      selectedDateEl.textContent = activeName
        ? 'Tap a date to mark ' + activeName + ' complete.'
        : 'Choose a habit to start tracking.';
    }
  }

  function getActiveHabitName(){
    var habit = habits.find(function(item){ return item.id === activeHabitId; });
    return habit ? habit.name : null;
  }

  function renderHabits(){
    if (habits.length === 0) {
      habitList.innerHTML = '';
      habitEmpty.style.display = 'block';
      return;
    }
    habitEmpty.style.display = 'none';
    habitList.innerHTML = habits.map(function(habit){
      var isActive = habit.id === activeHabitId;
      return '' +
        '<li class="habit-item">' +
          '<span>' + escapeHtml(habit.name) + '</span>' +
          '<div style="display:flex;gap:8px;">' +
            '<button type="button" data-action="select" data-id="' + habit.id + '" class="' + (isActive ? 'active' : '') + '">' + (isActive ? 'Active' : 'Select') + '</button>' +
            '<button type="button" data-action="remove" data-id="' + habit.id + '">Remove</button>' +
          '</div>' +
        '</li>';
    }).join('');

    habitList.querySelectorAll('button').forEach(function(button){
      button.addEventListener('click', function(){
        var action = button.dataset.action;
        var id = button.dataset.id;
        if (action === 'select') {
          activeHabitId = id;
          saveActiveHabit();
          renderAll();
        }
        if (action === 'remove') {
          removeHabit(id);
        }
      });
    });
  }

  function removeHabit(habitId){
    habits = habits.filter(function(habit){ return habit.id !== habitId; });
    if (activeHabitId === habitId) {
      activeHabitId = habits.length ? habits[0].id : null;
      saveActiveHabit();
    }
    Object.keys(completions).forEach(function(dateKey){
      if (completions[dateKey][habitId]) {
        delete completions[dateKey][habitId];
        if (Object.keys(completions[dateKey]).length === 0) {
          delete completions[dateKey];
        }
      }
    });
    saveHabits();
    saveCompletions();
    renderAll();
  }

  function renderCalendar(){
    monthLabel.textContent = view.toLocaleDateString(undefined,{month:'long',year:'numeric'});
    gridEl.innerHTML = '';
    var firstDay = new Date(view.getFullYear(), view.getMonth(), 1).getDay();
    var daysInMonth = new Date(view.getFullYear(), view.getMonth()+1, 0).getDate();

    for (var i = 0; i < firstDay; i++) {
      gridEl.appendChild(document.createElement('div'));
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(view.getFullYear(), view.getMonth(), day);
      var dateKey = key(date);
      var isToday = dateKey === key(today);
      var isFuture = date > today;
      var isSelected = selectedDate && dateKey === key(selectedDate);
      var button = document.createElement('button');
      button.textContent = day;
      button.className = 'date-button' + (isSelected ? ' selected' : '');
      button.disabled = isFuture || !activeHabitId;
      button.setAttribute('aria-label', 'Day ' + day + (activeHabitId ? ', ' + (getCompletion(dateKey, activeHabitId) ? 'complete' : 'incomplete') : '')); 

      var complete = activeHabitId && getCompletion(dateKey, activeHabitId);
      if (complete) {
        button.style.background = 'var(--color-text-primary)';
        button.style.color = 'var(--color-background-primary)';
        button.style.border = '0.5px solid var(--color-text-primary)';
      } else {
        button.style.background = 'transparent';
        button.style.color = isFuture ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)';
        button.style.border = isToday ? '0.5px solid var(--color-text-primary)' : '0.5px solid var(--color-border-tertiary)';
      }

      (function(dateKeyCopy, dateCopy, future){
        button.addEventListener('click', function(){
          if (future || !activeHabitId) return;
          selectedDate = dateCopy;
          toggleCompletion(dateKeyCopy, activeHabitId);
          renderAll();
        });
      })(dateKey, date, isFuture);

      gridEl.appendChild(button);
    }

    updateSelectedLabel();
    computeStreak();
  }

  function renderAll(){
    renderHabits();
    renderCalendar();
  }

  habitForm.addEventListener('submit', function(event){
    event.preventDefault();
    var name = habitInput.value.trim();
    if (!name) return;
    habits.push({ id: 'habit-' + Date.now(), name: name });
    activeHabitId = habits[habits.length - 1].id;
    saveHabits();
    saveActiveHabit();
    habitInput.value = '';
    renderAll();
  });

  function loadTheme(){
    var stored = localStorage.getItem(STORAGE_THEME);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme){
    document.documentElement.dataset.theme = theme;
    themeToggle.setAttribute('aria-label', 'Switch to ' + (theme === 'light' ? 'dark' : 'light') + ' theme');
    localStorage.setItem(STORAGE_THEME, theme);
  }

  themeToggle.addEventListener('click', function(){
    var current = document.documentElement.dataset.theme || loadTheme();
    applyTheme(current === 'light' ? 'dark' : 'light');
  });

  document.getElementById('prev').onclick = function(){
    view.setMonth(view.getMonth()-1);
    renderCalendar();
  };

  document.getElementById('next').onclick = function(){
    view.setMonth(view.getMonth()+1);
    renderCalendar();
  };

  if (!activeHabitId && habits.length) {
    activeHabitId = habits[0].id;
    saveActiveHabit();
  }

  applyTheme(loadTheme());
  renderAll();
})();