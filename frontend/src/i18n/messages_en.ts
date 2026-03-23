import type { Messages } from './messages_fr';

export const en: Messages = {
  // App
  app_name: 'Dinette',
  app_tagline: 'Your recipe book',

  // Navigation
  nav_home: 'Home',
  nav_favorites: 'Favourites',
  nav_add: 'Add',
  nav_suggest: 'Suggest',
  nav_profile: 'Profile',

  // Auth — Login
  login_subtitle: 'Sign in to your recipe book',
  login_email: 'Email',
  login_email_placeholder: 'you@example.com',
  login_password: 'Password',
  login_submit: 'Sign in',
  login_no_account: 'No account yet?',
  login_create_account: 'Create an account',

  // Auth — Register
  register_subtitle: 'Create your recipe book',
  register_name: 'First / Last name',
  register_name_placeholder: 'Your name',
  register_email: 'Email',
  register_email_placeholder: 'you@example.com',
  register_password: 'Password',
  register_password_placeholder: 'Min. 8 chars, 1 uppercase, 1 digit',
  register_confirm_password: 'Confirm password',
  register_submit: 'Create my account',
  register_has_account: 'Already have an account?',
  register_login_link: 'Sign in',

  // Validation
  validation_email_invalid: 'Invalid email address',
  validation_password_required: 'Password required',
  validation_password_min: 'At least 8 characters',
  validation_password_uppercase: 'Must contain an uppercase letter',
  validation_password_number: 'Must contain a digit',
  validation_passwords_mismatch: 'Passwords do not match',
  validation_name_required: 'Name required',
  validation_title_required: 'Title is required',
  validation_ingredient_name_required: 'Ingredient name is required',
  validation_step_required: 'Step description is required',
  validation_add_ingredient: 'Add at least one ingredient',
  validation_add_step: 'Add at least one step',

  // Home
  home_title_mobile: 'Dinette',
  home_title_desktop: 'Recipes',
  home_recipe_count_one: '1 recipe',
  home_recipe_count_other: '{count} recipes',
  home_add_recipe: 'New recipe',
  home_load_more: 'Load more',
  home_empty_title: 'No recipes',
  home_empty_filtered: 'No recipe matches your filters. Try adjusting them.',
  home_empty_default: 'Start building your recipe book!',
  home_empty_add: 'Add a recipe',
  home_empty_login: 'Sign in to add',

  // Filters
  filter_search_placeholder: 'Search a recipe...',
  filter_all: 'All',

  // Categories
  category_starter: 'Starter',
  category_main: 'Main course',
  category_dessert: 'Dessert',
  category_starters: 'Starters',
  category_mains: 'Main courses',
  category_desserts: 'Desserts',
  category_all: 'All categories',

  // Favorites
  favorites_title: 'Favourites',
  favorites_count_one: '1 saved recipe',
  favorites_count_other: '{count} saved recipes',
  favorites_empty_title: 'No favourites yet',
  favorites_empty_description: "Tap the heart on a recipe to save it here.",
  favorites_empty_browse: 'Browse recipes',

  // Recipe card / actions
  recipe_add_favorite: 'Add to favourites',
  recipe_remove_favorite: 'Remove from favourites',

  // Recipe detail
  recipe_back: 'Back',
  recipe_servings: '{count} servings',
  recipe_prep: 'Prep',
  recipe_cook: 'Cook',
  recipe_total: 'Total',
  recipe_ingredients_title: 'Ingredients',
  recipe_instructions_title: 'Instructions',
  recipe_edit: 'Edit',
  recipe_delete: 'Delete',
  recipe_delete_confirm: 'Delete this recipe? This cannot be undone.',
  recipe_not_found: 'Recipe not found',
  recipe_error_generic: 'Something went wrong',
  recipe_go_home: 'Go home',
  recipe_author: 'Recipe by {name}',
  recipe_tab_ingredients: 'Ingredients ({count})',
  recipe_tab_steps: 'Instructions ({count})',
  recipe_uncheck_all: 'Uncheck all',
  recipe_close: 'Close',

  // Recipe form
  form_create_title: 'New recipe',
  form_edit_title: 'Edit recipe',
  form_save: 'Save',
  form_cover_photo: 'Add a cover photo',
  form_cover_hint: 'JPEG, PNG or WebP, max 5 MB',
  form_title_label: 'Title *',
  form_title_placeholder: 'e.g. Spaghetti Carbonara',
  form_description_label: 'Description',
  form_description_placeholder: 'A short description of this recipe...',
  form_category_label: 'Category *',
  form_servings: 'Servings',
  form_prep_time: 'Prep (min)',
  form_cook_time: 'Cook (min)',
  form_ingredients_title: 'Ingredients *',
  form_add: 'Add',
  form_ingredient_name: 'Name',
  form_ingredient_qty: 'Qty',
  form_ingredient_unit: 'Unit',
  form_steps_title: 'Instructions *',
  form_add_step: 'Add a step',
  form_step_placeholder: 'Step {n}...',
  form_tags_title: 'Tags',
  form_tag_placeholder: 'e.g. vegetarian, quick...',
  form_create_submit: 'Create recipe',
  form_edit_submit: 'Save changes',

  // Suggest
  suggest_title: "No idea tonight?",
  suggest_subtitle: 'Let Dinette choose for you',
  suggest_filter_label: 'Filter by category',
  suggest_button: 'Surprise me!',
  suggest_loading: 'Searching...',
  suggest_view_recipe: 'View recipe',

  // Profile
  profile_title: 'Profile',
  profile_logout: 'Sign out',
  profile_language: 'Language',
  profile_language_fr: 'Français',
  profile_language_en: 'English',
  profile_change_password: 'Change password',
  profile_current_password: 'Current password',
  profile_new_password: 'New password',
  profile_confirm_new_password: 'Confirm new password',
  profile_save_password: 'Save',
  profile_password_success: 'Password changed successfully',
  profile_password_cancel: 'Cancel',

  // Groups
  groups_nav: 'Groups',
  groups_title: 'My groups',
  groups_create: 'Create a group',
  groups_join: 'Join',
  groups_join_title: 'Join a group',
  groups_join_code_label: 'Invite code',
  groups_join_code_placeholder: 'e.g. ABC123',
  groups_join_submit: 'Join',
  groups_empty_title: 'No groups yet',
  groups_empty_description: 'Create a family group or join one with an invite code.',
  groups_create_title: 'Create a group',
  groups_create_name_label: 'Group name',
  groups_create_name_placeholder: 'e.g. The Martins',
  groups_create_submit: 'Create',
  groups_members: '{count} member(s)',
  groups_invite_code: 'Invite code',
  groups_invite_copy: 'Copy',
  groups_invite_copied: 'Copied!',
  groups_leave: 'Leave group',
  groups_leave_confirm: 'Leave this group? You will no longer see shared recipes.',
  groups_recipes_empty: 'No recipes in this group yet.',
  groups_recipes_empty_hint: 'Create a recipe and pick this group to share it.',
  groups_back: 'Back',
  groups_you_owner: 'Admin',
  groups_member_since: 'Member since {date}',

  // Recipe form — group field
  form_group_label: 'Share in a group (optional)',
  form_group_none: 'Personal (not shared)',

  // Cover photo
  form_cover_gallery: 'Choose a photo',
  form_cover_camera: 'Take a photo',

  // Errors
  error_generic: 'An error occurred',

  // Stats labels in sheet
  stat_prep: 'Prep',
  stat_cook: 'Cook',
  stat_servings: 'Servings',
  stat_total: 'Total',
};
