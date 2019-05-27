import { withPluginApi } from "discourse/lib/plugin-api";
import UserCard from 'discourse/components/user-card-contents';
import { iconNode } from "discourse-common/lib/icon-library";
import {
    default as computed,
    observes
  } from "ember-addons/ember-computed-decorators";
  import debounce from "discourse/lib/debounce";
import { h } from "virtual-dom";
import {
    translateSize,
    avatarUrl,
    formatUsername
  } from "discourse/lib/utilities";
  import { dateNode, numberNode } from "discourse/helpers/node";

let containerRef = null;
let apiRef = null;
let user = null;

export function avatarImg(wanted, attrs) {
    const size = translateSize(wanted);
    const url = avatarUrl(attrs.template, size);
  
    // We won't render an invalid url
    if (!url || url.length === 0) {
      return;
    }
    const title = attrs.name || formatUsername(attrs.username);
  
    let className =
      "avatar" + (attrs.extraClasses ? " " + attrs.extraClasses : "");
  
    const properties = {
      attributes: {
        alt: "",
        width: size,
        height: size,
        src: Discourse.getURLWithCDN(url),
        title: " "
      },
      className
    };
  
    return h("img", properties);
  }

export function avatarFor(wanted, attrs) {
    return h(
      "a",
      {
        className: `trigger-user-card ${attrs.className || ""}`,
        attributes: { href: attrs.url, "data-user-card": attrs.username }
      },
      avatarImg(wanted, attrs)
    );
  }

String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
}

function initialize(api) {
    // see app/assets/javascripts/discourse/lib/plugin-api
    // for the functions available via the api object
    apiRef = api;

    api.reopenWidget("topic-map-summary", {
        html(attrs, state) {
            const contents = [];
            contents.push(
              h("li", [
                h(
                  "h4",
                  {
                    attributes: { role: "presentation" }
                  },
                  I18n.t("created_lowercase")
                ),
                h("div.topic-map-post.created-at", [
                  avatarFor("tiny", {
                    username: "",
                    template: attrs.createdByAvatarTemplate,
                    name: ""
                  }),
                  dateNode(attrs.topicCreatedAt)
                ])
              ])
            );
            contents.push(
              h(
                "li",
                h("a", { attributes: { href: attrs.lastPostUrl } }, [
                  h(
                    "h4",
                    {
                      attributes: { role: "presentation" }
                    },
                    I18n.t("last_reply_lowercase")
                  ),
                  h("div.topic-map-post.last-reply", [
                    avatarFor("tiny", {
                      username: "",
                      template: attrs.lastPostAvatarTemplate,
                      name: ""
                    }),
                    dateNode(attrs.lastPostAt)
                  ])
                ])
              )
            );
            contents.push(
              h("li", [
                numberNode(attrs.topicReplyCount),
                h(
                  "h4",
                  {
                    attributes: { role: "presentation" }
                  },
                  I18n.t("replies_lowercase", {
                    count: attrs.topicReplyCount
                  }).toString()
                )
              ])
            );
            contents.push(
              h("li.secondary", [
                numberNode(attrs.topicViews, { className: attrs.topicViewsHeat }),
                h(
                  "h4",
                  {
                    attributes: { role: "presentation" }
                  },
                  I18n.t("views_lowercase", { count: attrs.topicViews }).toString()
                )
              ])
            );
        
            if (attrs.participantCount > 0) {
              contents.push(
                h("li.secondary", [
                  numberNode(attrs.participantCount),
                  h(
                    "h4",
                    {
                      attributes: { role: "presentation" }
                    },
                    I18n.t("users_lowercase", {
                      count: attrs.participantCount
                    }).toString()
                  )
                ])
              );
            }
        
            if (attrs.topicLikeCount) {
              contents.push(
                h("li.secondary", [
                  numberNode(attrs.topicLikeCount),
                  h(
                    "h4",
                    {
                      attributes: { role: "presentation" }
                    },
                    I18n.t("likes_lowercase", {
                      count: attrs.topicLikeCount
                    }).toString()
                  )
                ])
              );
            }
        
            if (attrs.topicLinkLength > 0) {
              contents.push(
                h("li.secondary", [
                  numberNode(attrs.topicLinkLength),
                  h(
                    "h4",
                    {
                      attributes: { role: "presentation" }
                    },
                    I18n.t("links_lowercase", {
                      count: attrs.topicLinkLength
                    }).toString()
                  )
                ])
              );
            }
        
            if (
              state.collapsed &&
              attrs.topicPostsCount > 2 &&
              attrs.participants &&
              attrs.participants.length > 0
            ) {
              const participants = renderParticipants.call(
                this,
                attrs.userFilters,
                attrs.participants.slice(0, 3)
              );
              contents.push(h("li.avatars", participants));
            }
        
            const nav = h(
              "nav.buttons",
              this.attach("button", {
                title: "topic.toggle_information",
                icon: state.collapsed ? "chevron-down" : "chevron-up",
                action: "toggleMap",
                className: "btn"
              })
            );
        
            return [nav, h("ul.clearfix", contents)];
          }
    });

    api.reopenWidget("topic-participant", {
        html(attrs, state) {
            const linkContents = [
              avatarImg("medium", {
                username: "",
                template: attrs.avatar_template,
                name: ""
              })
            ];
        
            if (attrs.post_count > 2) {
              linkContents.push(h("span.post-count", attrs.post_count.toString()));
            }
        
            if (attrs.primary_group_flair_url || attrs.primary_group_flair_bg_color) {
              linkContents.push(this.attach("avatar-flair", attrs));
            }
        
            return h(
              "a.poster.trigger-user-card",
              {
                className: state.toggled ? "toggled" : null,
                attributes: { title: "", "data-user-card": "" }
              },
              linkContents
            );
          }
    });

    api.reopenWidget("post-avatar", {
        html(attrs) {
            let body;

            if (!attrs.user_id) {
            body = iconNode("far-trash-alt", { class: "deleted-user-avatar" });
            } else {
            body = avatarFor.call(this, "large", {
                template: attrs.avatar_template,
                username: attrs.username,
                name: attrs.name,
                url: attrs.usernameUrl,
                className: "main-avatar"
            });
            }

            const result = [body];

            if (attrs.primary_group_flair_url || attrs.primary_group_flair_bg_color) {
            result.push(this.attach("avatar-flair", attrs));
            }

            result.push(h("div.poster-avatar-extra"));

            if (this.settings.displayPosterName) {
            result.push(this.attach("post-avatar-user-info", attrs));
            }

            return result;
        }
    });

    api.reopenWidget("poster-name", {
        userLink(attrs, text) {
            let username = attrs.username;
            let name = attrs.name;
            let nameText = "";
          debugger
            if(name !== "") {
                const textArray = name.split("-");

                if(textArray.length === 1) {
                    nameText = name;
                }

                else {
                    nameText = textArray[0];
                    const resultArray = nameText.split(" ");

                    if (resultArray.length > 1) {
                        for (let i = 0; i < resultArray[0].length; i++) {
                            if(i === 0)
                                continue;
                            
                                resultArray[0] = resultArray[0].replaceAt(i, "*");
                        }

                        for (let i = 0; i < resultArray[1].length; i++) {
                            if(i === 0)
                                continue;
                            
                                resultArray[1] = resultArray[1].replaceAt(i, "*");
                        }

                        nameText = resultArray[0] + " " + resultArray[1];
                    }

                    else {
                        for (let i = 0; i < resultArray[0].length; i++) {
                            if(i === 0)
                                continue;
                            
                            resultArray[0] = resultArray[0].replaceAt(i, "*");
                        }

                        nameText = resultArray[0];
                    }
                }
            }

            return h(
              "a",
              {
                attributes: {
                  href: attrs.usernameUrl,
                  "data-user-card": attrs.username
                }
              },
              formatUsername(nameText)
            );
          }
    });

    api.modifyClass('controller:user', {
        init() {
            this._super();
            
        },
        show: debounce(function() {
            let user = Object.assign({}, this.get("model"));
            let username = user.username;
            let name = user.name;
            let nameText = "";
          debugger
            if (user) {
                if(name) {
                    const textArray = name.split("-");

                    if(textArray.length === 1) {
                        nameText = name;
                    }

                    else {
                        nameText = textArray[0];
                        const resultArray = nameText.split(" ");

                        if (resultArray.length > 1) {
                            for (let i = 0; i < resultArray[0].length; i++) {
                                if(i === 0)
                                    continue;
                                
                                    resultArray[0] = resultArray[0].replaceAt(i, "*");
                            }
    
                            for (let i = 0; i < resultArray[1].length; i++) {
                                if(i === 0)
                                    continue;
                                
                                    resultArray[1] = resultArray[1].replaceAt(i, "*");
                            }

                            nameText = resultArray[0] + " " + resultArray[1];
                        }

                        else {
                            for (let i = 0; i < resultArray[0].length; i++) {
                                if(i === 0)
                                    continue;
                                
                                resultArray[0] = resultArray[0].replaceAt(i, "*");
                            }

                            nameText = resultArray[0];
                        }
                    }

                    user.name = nameText;
                }

                this.setProperties({gibName: nameText});
                this.set("gibName", nameText);
            }

            
            
          }, 50).observes("model"), 
        @computed()
        gibName() {
            const user = this.get("model");
            let username = user.username;
            let name = user.name;
            let nameText = "";
          debugger
            if (user) {
                if(name) {
                    const textArray = name.split("-");

                    if(textArray.length === 1) {
                        nameText = name;
                    }

                    else {
                        nameText = textArray[0];
                        const resultArray = nameText.split(" ");

                        if (resultArray.length > 1) {
                            for (let i = 0; i < resultArray[0].length; i++) {
                                if(i === 0)
                                    continue;
                                
                                    resultArray[0] = resultArray[0].replaceAt(i, "*");
                            }
    
                            for (let i = 0; i < resultArray[1].length; i++) {
                                if(i === 0)
                                    continue;
                                
                                    resultArray[1] = resultArray[1].replaceAt(i, "*");
                            }

                            nameText = resultArray[0] + " " + resultArray[1];
                        }

                        else {
                            for (let i = 0; i < resultArray[0].length; i++) {
                                if(i === 0)
                                    continue;
                                
                                resultArray[0] = resultArray[0].replaceAt(i, "*");
                            }

                            nameText = resultArray[0];
                        }
                    }

                    user.name = nameText;
                }
            }

            //this.set("gibName", "osman");
            //this.notifyPropertyChange("model");
            return nameText;
        }
    });

    UserCard.reopen({
        willRender: function() {
            user = this.get("user");
            debugger
            if (user) {
                let username = user.username;
                let name = user.name;
                let nameText = "";

                if(name) {
                    const textArray = name.split("-");

                    if(textArray.length === 1) {
                        nameText = name;
                    }

                    else {
                        nameText = textArray[0];
                        const resultArray = nameText.split(" ");

                        if (resultArray.length > 1) {
                            for (let i = 0; i < resultArray[0].length; i++) {
                                if(i === 0)
                                    continue;
                                
                                    resultArray[0] = resultArray[0].replaceAt(i, "*");
                            }
    
                            for (let i = 0; i < resultArray[1].length; i++) {
                                if(i === 0)
                                    continue;
                                
                                    resultArray[1] = resultArray[1].replaceAt(i, "*");
                            }

                            nameText = resultArray[0] + " " + resultArray[1];
                        }

                        else {
                            for (let i = 0; i < resultArray[0].length; i++) {
                                if(i === 0)
                                    continue;
                                
                                resultArray[0] = resultArray[0].replaceAt(i, "*");
                            }

                            nameText = resultArray[0];
                        }
                    }

                    user.name = nameText;
                }
            }
            
        },
        didRender: function() {
            user = this.get("user");

            if (user) {
                let dom = this.$(".metadata");
                const joinDate = new Date(user.created_at);
                const lastPostedDate = new Date(user.last_posted_at);
                const joinDateString = joinDate.toLocaleDateString("tr-TR");
                const lastPostedDateString = lastPostedDate.toLocaleDateString("tr-TR");
                const joinDateDom = "<h3>"+I18n.t("profile_card.join_title")+"<span>"+ joinDateString +"</span></h3>";
                const lastPostDateDom = "<h3>"+I18n.t("profile_card.last_post_title")+"<span>"+lastPostedDateString+"</span></h3>";
                const roleDom = "<h3><span>"+(user.admin ? 'Admin': 'Üye')+"</span></h3>";
                const newDom = joinDateDom + lastPostDateDom + roleDom;
                dom.html(newDom);
                $("h1.username a").text(user.name);
                $("#user-card h2.full-name").text("");
            }
            
        },
        click: function() {
            user = this.get("user");
            console.log(this.$(".metadata"));
            
        }
    });
}

export default {
    name: 'profile-card',
    initialize(container) {
        containerRef = container;
        const siteSettings = container.lookup("site-settings:main");
        if (siteSettings.profile_card_enabled)
            withPluginApi("0.8.7", initialize);
    }
};
