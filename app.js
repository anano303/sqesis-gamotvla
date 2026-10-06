const form = document.querySelector('#calculator');
const resultBox = document.querySelector('#result');
const errorBox = document.querySelector('#error');
function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function addYears(date, years) {
  const year = date.getUTCFullYear() + years;
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDay)));
}

function latestRenewal(anchor, cycle, limit) {
  if (anchor > limit) return null;
  let count = Math.floor((limit.getUTCFullYear() - anchor.getUTCFullYear()) / cycle);
  let date = addYears(anchor, count * cycle);
  while (date > limit) date = addYears(anchor, (count -= 1) * cycle);
  while (addYears(anchor, (count + 1) * cycle) <= limit) {
    date = addYears(anchor, ++count * cycle);
  }
  return date;
}

function pretty(date) {
  return new Intl.DateTimeFormat('ka-GE', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

function compare(motherDate, fatherDate) {
  if (!motherDate && !fatherDate) return { type: 'none' };
  if (!motherDate || !fatherDate) {
    return { type: 'one', gender: motherDate ? 'girl' : 'boy', motherDate, fatherDate };
  }
  const delta = motherDate - fatherDate;
  if (delta === 0) return { type: 'tie', motherDate, fatherDate };
  return { type: 'winner', gender: delta > 0 ? 'girl' : 'boy', motherDate, fatherDate };
}

function line(label, calc) {
  if (calc.type === 'none') return `<p><strong>${label}:</strong> ვარაუდი ვერ გამოითვალა.</p>`;
  const motherDate = calc.motherDate ? pretty(calc.motherDate) : 'ციკლი ჯერ არ დაწყებულა';
  const fatherDate = calc.fatherDate ? pretty(calc.fatherDate) : 'ციკლი ჯერ არ დაწყებულა';
  const conclusion = calc.type === 'tie'
    ? 'განახლების თარიღები დაემთხვა'
    : calc.gender === 'girl'
      ? 'დედის თარიღია უფრო გვიანი → გოგოს ვარაუდი'
      : 'მამის თარიღია უფრო გვიანი → ბიჭის ვარაუდი';
  return `<p><strong>${label}:</strong> დედა — ${motherDate}; მამა — ${fatherDate}. ${conclusion}.</p>`;
}

function renderOutcome(gender, percent) {
  const isGirl = gender === 'girl';
  return `<div class="outcome ${gender}"><small>${isGirl ? '👧 გოგოს ვარაუდი' : '👦 ბიჭის ვარაუდი'}</small><strong>${percent}%</strong></div>`;
}

function makeResult(birthCalc, operationCalc, hasOperation) {
  let title;
  let subtitle;
  let choices;

  if (!hasOperation) {
    if (birthCalc.type === 'tie' || birthCalc.type === 'none') {
      title = birthCalc.type === 'tie' ? 'განახლების თარიღები დაემთხვა' : 'ვარაუდი ვერ გამოითვალა';
      subtitle = birthCalc.type === 'tie'
        ? 'ამ კალკულატორის წესით ორივე ვარიანტი შესაძლებელია.'
        : 'შეამოწმეთ შეყვანილი თარიღები.';
      choices = renderOutcome('girl', 70) + renderOutcome('boy', 30);
    } else {
      const other = birthCalc.gender === 'girl' ? 'boy' : 'girl';
      title = `ამ მეთოდის ვარაუდი: ${birthCalc.gender === 'girl' ? 'გოგო' : 'ბიჭი'}`;
      subtitle = 'დაბადების თარიღებიდან დათვლილი ბოლო განახლების თარიღი ამ კალკულატორში ვარაუდს განსაზღვრავს.';
      choices = renderOutcome(birthCalc.gender, 99) + renderOutcome(other, 1);
    }
  } else {
    const bothAgree = birthCalc.type !== 'tie' && birthCalc.type !== 'none'
      && operationCalc.type !== 'tie' && operationCalc.type !== 'none'
      && birthCalc.gender === operationCalc.gender;

    if (bothAgree) {
      title = `ორივე გამოთვლა ემთხვევა: ${birthCalc.gender === 'girl' ? 'გოგო' : 'ბიჭი'}`;
      subtitle = 'დაბადებისა და ოპერაციის თარიღებიდან დათვლილი ვარაუდები ერთსა და იმავე შედეგს აჩვენებს.';
      choices = renderOutcome(birthCalc.gender, 99) + renderOutcome(birthCalc.gender === 'girl' ? 'boy' : 'girl', 1);
    } else {
      const candidates = new Set([birthCalc.gender, operationCalc.gender].filter(Boolean));
      title = 'გამოთვლები ერთმანეთს არ ემთხვევა';
      subtitle = 'დაბადებისა და ოპერაციის თარიღებიდან დათვლილი ვარაუდები განსხვავდება.';
      if (candidates.size === 1) {
        const gender = [...candidates][0];
        choices = renderOutcome(gender, 70) + renderOutcome(gender === 'girl' ? 'boy' : 'girl', 30);
      } else if (candidates.size === 2) {
        choices = renderOutcome(birthCalc.gender, 70) + renderOutcome(birthCalc.gender === 'girl' ? 'boy' : 'girl', 30);
      } else {
        choices = renderOutcome('girl', 50) + renderOutcome('boy', 50);
      }
    }
  }

  const operationLines = hasOperation
    ? line('ოპერაციის თარიღებიდან', operationCalc)
    : '';
  return `<h2 class="result-title">${title}</h2><p class="result-sub">${subtitle}</p><div class="outcomes">${choices}</div><div class="details"><h3>გამოთვლის დეტალები</h3>${line('დაბადების თარიღებიდან', birthCalc)}${operationLines}</div><p class="result-disclaimer">პროცენტები ამ გამოთვლის მოდელს ასახავს და არა დადასტურებულ ალბათობას.</p>`;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  resultBox.classList.remove('show');

  const motherBirth = parseDate(form.motherDob.value);
  const fatherBirth = parseDate(form.fatherDob.value);
  const conception = parseDate(form.conception.value);
  const motherOperation = parseDate(form.motherOperation.value);
  const fatherOperation = parseDate(form.fatherOperation.value);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (!motherBirth || !fatherBirth || !conception) {
    errorBox.textContent = 'გთხოვთ, შეავსოთ ორივე დაბადების თარიღი და ჩასახვის სავარაუდო თარიღი.';
    return;
  }
  if (motherBirth > conception || fatherBirth > conception) {
    errorBox.textContent = 'დაბადების თარიღი ჩასახვის თარიღზე გვიან ვერ იქნება.';
    return;
  }
  if (conception > today) {
    errorBox.textContent = 'ჩასახვის თარიღი მომავალში ვერ იქნება.';
    return;
  }
  if (motherOperation && (motherOperation < motherBirth || motherOperation > conception)) {
    errorBox.textContent = 'დედის ოპერაციის თარიღი მის დაბადებასა და ჩასახვის თარიღს შორის უნდა იყოს.';
    return;
  }
  if (fatherOperation && (fatherOperation < fatherBirth || fatherOperation > conception)) {
    errorBox.textContent = 'მამის ოპერაციის თარიღი მის დაბადებასა და ჩასახვის თარიღს შორის უნდა იყოს.';
    return;
  }

  const motherBirthRenewal = latestRenewal(motherBirth, 3, conception);
  const fatherBirthRenewal = latestRenewal(fatherBirth, 4, conception);
  const birthCalc = compare(motherBirthRenewal, fatherBirthRenewal);
  const hasOperation = Boolean(motherOperation || fatherOperation);
  let operationCalc = null;

  if (hasOperation) {
    const motherAnchor = motherOperation || motherBirth;
    const fatherAnchor = fatherOperation || fatherBirth;
    operationCalc = compare(
      latestRenewal(motherAnchor, 3, conception),
      latestRenewal(fatherAnchor, 4, conception),
    );
  }

  resultBox.innerHTML = makeResult(birthCalc, operationCalc, hasOperation);
  resultBox.classList.add('show');
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
