DOCKER := bazwilliams/upnp-playlist-service
DOCKER_BRANCH_TAG := $(shell echo ${TRAVIS_BRANCH} | sed s/\#/_/g)
TIMESTAMP := $(shell date --utc +%FT%TZ)

define tag_docker
	@if [ "$(TRAVIS_BRANCH)" != "master" ]; then \
		docker tag $(1):$(TRAVIS_BUILD_NUMBER) $(1):$(DOCKER_BRANCH_TAG); \
	fi
	@if [ "$(TRAVIS_BRANCH)" = "master" -a "$(TRAVIS_PULL_REQUEST)" = "false" ]; then \
		docker tag $(1):$(TRAVIS_BUILD_NUMBER) $(1):latest; \
	fi
	@if [ "$(TRAVIS_PULL_REQUEST)" != "false" ]; then \
		docker tag $(1):$(TRAVIS_BUILD_NUMBER) $(1):PR_$(TRAVIS_PULL_REQUEST); \
	fi
endef

define label_dockerfile
	@echo "LABEL vendor=Barry John Williams \\" >> $(1)
	@echo "      uk.me.bjw.release-date=$(TIMESTAMP) \\" >> $(1)
	@echo "      uk.me.bjw.build-number=$(TRAVIS_BUILD_NUMBER) \\" >> $(1)
	@echo "      uk.me.bjw.commit=$(TRAVIS_COMMIT) \\" >> $(1)
	@echo "      uk.me.bjw.branch=$(TRAVIS_BRANCH) \\" >> $(1)
	@if [ "$(TRAVIS_BRANCH)" = "master" -a "$(TRAVIS_PULL_REQUEST)" = "false" ]; then \
		echo "      uk.me.bjw.is-production=true" >> $(1); \
	else \
		echo "      uk.me.bjw.is-production=false" >> $(1); \
	fi
endef

all-the-dockers:
	$(call label_dockerfile, Dockerfile)
	docker build -t $(DOCKER):$(TRAVIS_BUILD_NUMBER) .

docker-push:
	$(call tag_docker, $(DOCKER))
	docker push $(DOCKER)
