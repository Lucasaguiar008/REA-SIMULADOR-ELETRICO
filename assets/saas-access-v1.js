(() => {
  'use strict';

  const fullCapabilities = {
    can_simulate: true,
    can_view_examples: true,
    can_open_codegen: true,
    can_create_project: true,
    can_edit_project: true,
    can_save_project: true,
    can_clone_example: true,
    can_generate_code: true,
    can_export: true,
    can_customize_sheet: true,
    can_use_components: true,
    can_edit_components: true,
    can_create_user_components: true,
    can_access_svg_editor: true,
    can_edit_standard_examples_temporarily: true,
    can_manage_library: true,
    can_edit_official_examples: true,
    can_access_admin: false,
  };

  const access = Object.assign(window.TECHRIB_USER_ACCESS || {}, {
    authenticated: true,
    id: 1,
    user: 'lucasaguiar',
    name: 'Lucas Aguiar',
    email: '',
    role: 'pro',
    isAdmin: false,
    hasActiveSubscription: true,
    planLabel: 'Local',
    subscription: { status: 'active' },
    capabilities: fullCapabilities,
    canEditPremiumExamples: true,
    canEditStandardExamples: true,
  });

  window.TECHRIB_USER_ACCESS = access;
  document.body.classList.remove('techrib-read-only', 'techrib-free-lab');

  // Remove qualquer referência visual a conta/login/plano na barra superior
  document
    .querySelectorAll('.techrib-plan-chip, .user-button, .saas-upgrade-modal, .saas-clone-example')
    .forEach((el) => el.remove());

  const status = document.querySelector('[data-autosave-status]');
  if (status) {
    status.textContent = 'Salvo na memória local do navegador';
  }

  window.TechRibSaaS = {
    access,
    showUpgrade: () => {},
    can: () => true,
    refreshAccess: () => {},
  };

  window.addEventListener('load', async () => {
    const params = new URLSearchParams(location.search);
    const projectId = params.get('project');
    const exampleId = params.get('example');
    try {
      if (projectId) {
        await window.TechRibSaaSBridge?.openProjectById?.(projectId);
        return;
      }
      if (params.get('newProject') === '1') {
        window.TechRibSaaSBridge?.newProject?.();
        return;
      }
      if (!exampleId) {
        const raw = localStorage.getItem('lucasaguiar.autosave.current.v1');
        if (raw) {
          const savedProject = JSON.parse(raw);
          if (savedProject && Array.isArray(savedProject.components) && savedProject.components.length > 0) {
            await window.TechRibSaaSBridge?.openClonedProject?.({
              id: localStorage.getItem('techrib.serverProjectId') || 'local-autosave',
              project: savedProject,
            });
          }
        }
      }
    } catch (err) {
      console.warn('LucasAguiar LocalStorage: falha ao restaurar sessão anterior.', err);
    }
  });
})();
