// ===== Supabase 接続設定 =====
// SupabaseのプロジェクトURLとanon keyをここに入力してください
const SUPABASE_URL = 'https://nbmptzgcumtbztiigzmd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ibXB0emdjdW10Ynp0aWlnem1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODE3MjIsImV4cCI6MjA5NzE1NzcyMn0.k4haZroBx-eP80b1ybyXEjYazBlSi_L4riTn5VVuoZI'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ===== 投稿一覧を取得して表示 =====
async function loadProposals() {
  const list = document.getElementById('proposals-list')

  const { data, error } = await db
    .from('proposals')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    list.innerHTML = '<p class="loading">投稿の読み込みに失敗しました。</p>'
    console.error(error)
    return
  }

  if (data.length === 0) {
    list.innerHTML = '<p class="empty-message">まだ投稿がありません。最初の一件を投稿してみましょう！</p>'
    return
  }

  list.innerHTML = data.map(item => {
    const date = new Date(item.created_at).toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
    return `
      <div class="proposal-card">
        <div class="card-meta">
          <span class="category-badge ${item.category}">${item.category}</span>
          <span class="card-date">${date}</span>
        </div>
        <p class="card-content">${escapeHtml(item.content)}</p>
      </div>
    `
  }).join('')
}

// ===== フォーム送信処理 =====
document.getElementById('proposal-form').addEventListener('submit', async (e) => {
  e.preventDefault()

  const category = document.getElementById('category').value
  const content = document.getElementById('content').value.trim()
  const btn = document.getElementById('submit-btn')
  const msg = document.getElementById('form-message')

  if (!content) return

  btn.disabled = true
  btn.textContent = '送信中...'
  msg.textContent = ''
  msg.className = 'form-message'

  const { error } = await db
    .from('proposals')
    .insert([{ category, content }])

  if (error) {
    msg.textContent = '送信に失敗しました。もう一度お試しください。'
    msg.className = 'form-message error'
    console.error(error)
  } else {
    msg.textContent = '投稿しました！ありがとうございます。'
    msg.className = 'form-message success'
    document.getElementById('proposal-form').reset()
    await loadProposals()
  }

  btn.disabled = false
  btn.textContent = '送信する'
})

// ===== カテゴリ別投稿例 =====
const EXAMPLES = {
  '業務プロセス・生産性向上': '投稿例：有給申請や勤務時間変更などの勤怠申請を、フォームから送って上長に承認してもらえる仕組みがあると嬉しいです！',
  '職場環境・インフラ整備': '投稿例：会議室が足りなくて困っています。個人ブースがあると助かります！',
  '社内制度・組織運営': '投稿例：リロクラブやベネフィット・ワンのような福利厚生サービスを導入してほしいです！',
}

function updateExample() {
  const category = document.getElementById('category').value
  const el = document.getElementById('example-text')
  el.textContent = EXAMPLES[category] || ''
}

// ===== XSS対策 =====
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ===== 管理者モーダル =====
const ADMIN_PASSWORD = 'ufas0206'

function openAdminModal() {
  document.getElementById('admin-modal').classList.add('active')
  document.getElementById('admin-password').value = ''
  document.getElementById('modal-message').textContent = ''
}

function closeAdminModal() {
  document.getElementById('admin-modal').classList.remove('active')
}

async function resetProposals() {
  const input = document.getElementById('admin-password').value
  const msg = document.getElementById('modal-message')

  if (input !== ADMIN_PASSWORD) {
    msg.textContent = 'パスワードが違います'
    return
  }

  const { error } = await db.from('proposals').delete().neq('id', 0)

  if (error) {
    msg.textContent = '削除に失敗しました'
    console.error(error)
  } else {
    closeAdminModal()
    await loadProposals()
  }
}

document.getElementById('admin-modal').addEventListener('click', (e) => {
  if (e.target === document.getElementById('admin-modal')) closeAdminModal()
})

// ===== 初期ロード =====
loadProposals()
