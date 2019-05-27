# name: profile-card
# about: This plugin changes profile card component.
# version: 1.3.2
# authors: Alptuğ Türkiş

register_asset 'stylesheets/profile-card.scss'
enabled_site_setting :profile_card_enabled

after_initialize do
    require_dependency 'user'
    class ::User
  
      def self.system_avatar_template(username)
        # TODO it may be worth caching this in a distributed cache, should be benched
        if SiteSetting.external_system_avatars_enabled
          url = SiteSetting.external_system_avatars_url.dup
          url.gsub! "{color}", letter_avatar_color(username.downcase)
          url.gsub! "{username}", username
          url.gsub! "{name_first_letter}", get_name_first_letter(username)
          url.gsub! "{first_letter}", username[0].downcase
          url.gsub! "{hostname}", Discourse.current_hostname
          url
        else
          "#{Discourse.base_uri}/letter_avatar/#{username.downcase}/{size}/#{LetterAvatar.version}.png"
        end
      end
  
      def self.get_name_first_letter(username)
        if user = User.find_by_username(username)
          name = user.name.presence ? user.name.gsub(/[^a-zA-Z0-9]/,'') : ''
        else
          name = ''
        end
        name.presence ? user.name.gsub(/\W+/,'')[0].downcase : username[0].downcase
      end
    end
  
  end