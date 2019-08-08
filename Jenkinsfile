#!/usr/bin/env groovy

// This is a Jenkins scripted pipeline for building and deploying Waves Web Client docker images

@Library('jenkins-shared-lib')
import devops.waves.*
ut = new utils()
def buildTasks = [:]
def deployTasks = [:]
def container_info = ''
buildTasks.failFast = true
def repo_url = 'https://github.com/wavesplatform/WavesGUI.git'
def pipeline_trigger_token = 'wavesGuiGithubToken'
properties([

    [$class: 'BuildDiscarderProperty', strategy: [$class: 'LogRotator', artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '14', numToKeepStr: '30']],

    parameters([
        choice(choices: ['Build', 'Build and Deploy', 'Deploy'], description: '', name: 'action'),
        [$class: 'CascadeChoiceParameter',
            choiceType: 'PT_SINGLE_SELECT',
            description: '', filterLength: 1,
            filterable: true,
            name: 'source',
            randomName: 'choice-parameter-6919304534316082',
            referencedParameters: 'action',
            script: [$class: 'GroovyScript',
                fallbackScript: [classpath: [], sandbox: false, script: 'return ["There was a problem fetching the artifacts..."]'],
                script: [ classpath: [], sandbox: false, script: """
                    import jenkins.model.Jenkins
                    import groovy.json.JsonSlurper
                    import com.cloudbees.hudson.plugins.folder.properties.FolderCredentialsProvider.FolderCredentialsProperty
                    import com.cloudbees.hudson.plugins.folder.AbstractFolder
                    import com.cloudbees.hudson.plugins.folder.Folder
                    import com.cloudbees.plugins.credentials.impl.*
                    import com.cloudbees.plugins.credentials.*
                    import com.cloudbees.plugins.credentials.domains.*

                    if (binding.variables.get('action') == 'Deploy') {

                        def image_name = 'waves/wallet'
                        cred_id = "${Constants.DOCKER_REGISTRY_CREDS}"

                        def authString = ""
                        def credentials_store =
                        Jenkins.instance.getAllItems(Folder.class)
                            .findAll{it.name.equals('Waves')}
                            .each{
                                AbstractFolder<?> folderAbs = AbstractFolder.class.cast(it)
                                FolderCredentialsProperty property = folderAbs.getProperties().get(FolderCredentialsProperty.class)
                                if(property != null){
                                    for (cred in property.getCredentials()){
                                        if ( cred.id == cred_id ) {
                                            authString  = "\${cred.username}:\${cred.password}"
                                        }
                                    }
                                }
                            }

                        def response = ["curl", "-u", "\${authString}", "-k", "-X", "GET", "${Constants.DOCKER_REGISTRY_ADDRESS}/api/repositories/\${image_name}/tags"].execute().text.replaceAll("\\r\\n", "")
                        def data = new groovy.json.JsonSlurperClassic().parseText(response)

                        def tags_by_date = [:]
                        def timestamps = []
                        def sorted_tags = []

                        data.each{
                            if (it.name.contains('latest')){
                                tags_by_date[it.created] = it.name
                                timestamps.push(it.created)
                            }
                        }

                        timestamps = timestamps.sort().reverse()

                        for(timestamp in timestamps){
                            sorted_tags.push(tags_by_date[timestamp])
                        }
                        return sorted_tags
                    } else {
                        def gettags = ("git ls-remote -t -h ${repo_url}").execute()

                        return gettags.text.readLines().collect {
                            it.split()[1].replaceAll(\'refs/heads/\', \'\').replaceAll(\'refs/tags/\', \'\').replaceAll("\\\\^\\\\{\\\\}", \'\')
                        }
                    }
                    """
                ]
            ]
        ],
        [$class: 'CascadeChoiceParameter',
            choiceType: 'PT_SINGLE_SELECT',
            description: '', filterLength: 1,
            name: 'image',
            randomName: 'choice-parameter-69159083423764582',
            referencedParameters: 'action',
            script: [$class: 'GroovyScript',
                fallbackScript: [classpath: [], sandbox: false, script: 'return ["There was a problem..."]'],
                script: [ classpath: [], sandbox: false, script: """
                    if (binding.variables.get('action') == 'Build') {
                        return []
                    } else {
                        return ['wallet', 'wallet-electron']
                    }
                    """
                ]
            ]
        ],
        [$class: 'CascadeChoiceParameter',
            choiceType: 'PT_SINGLE_SELECT',
            description: '', filterLength: 1,
            name: 'destination',
            randomName: 'choice-parameter-69324734886082',
            referencedParameters: 'action',
            script: [$class: 'GroovyScript',
                fallbackScript: [classpath: [], sandbox: false, script: 'return ["There was a problem..."]'],
                script: [ classpath: [], sandbox: false, script: """
                    if (binding.variables.get('action') == 'Build') {
                        return []
                    } else {
                        return ${Constants.WAVES_WALLET_STAGE_SERVERS}
                    }
                    """
                ]
            ]
        ],
        [$class: 'CascadeChoiceParameter',
            choiceType: 'PT_SINGLE_SELECT',
            description: '', filterLength: 1,
            name: 'network',
            randomName: 'choice-parameter-6919234234886082',
            referencedParameters: 'action',
            script: [$class: 'GroovyScript',
                fallbackScript: [classpath: [], sandbox: false, script: 'return ["There was a problem..."]'],
                script: [ classpath: [], sandbox: false, script: """
                    if (binding.variables.get('action') == 'Build') {
                        return []
                    } else {
                        return ${Constants.WAVES_WALLET_NETWORKS}
                    }
                    """
                ]
            ]
        ]
    ]),

    pipelineTriggers([
        [$class: 'GenericTrigger',
        genericVariables: [
            [ key: 'source', value: '$.ref', regexpFilter: 'refs/heads/', defaultValue: '' ],
            [ key: 'deleted', value: '$.deleted']],
        regexpFilterText: '$deleted',
        regexpFilterExpression: 'false',
        causeString: "Triggered by GitHub Webhook",
        printContributedVariables: true,
        printPostContent: true,
        token: pipeline_trigger_token ]
    ])
])

stage('Aborting this build'){
    // On the first launch pipeline doesn't have any parameters configured and must skip all the steps
    if (env.BUILD_NUMBER == '1'){
        echo "This is the first run of the pipeline! It is now should be configured and ready to go!"
        currentBuild.result = Constants.PIPELINE_ABORTED
        return
    }
    if (! source ) {
        echo "Aborting this build. Please run it again with the required parameters specified."
        currentBuild.result = Constants.PIPELINE_ABORTED
        return
    }
    else
        echo "Parameters are specified:\n" +
        "action: ${action}\n" +
        "source: ${source}\n" +
        "image: ${image}\n" +
        "destination: ${destination}\n" +
        "network: ${network}"
}

if (currentBuild.result == Constants.PIPELINE_ABORTED){
    return
}

timeout(time:20, unit:'MINUTES') {
    node('buildagent'){
        currentBuild.result = Constants.PIPELINE_SUCCESS
        timestamps {
            wrap([$class: 'AnsiColorBuildWrapper', 'colorMapName': 'XTerm']) {
                try {
                    currentBuild.displayName = "#${env.BUILD_NUMBER} - ${source} - ${action}"

                        stage('Checkout') {
                            sh 'env'
                            step([$class: 'WsCleanup'])
                            if (action.contains('Build')) {
                                def scmVars = checkout([
                                    $class: 'GitSCM',
                                    branches: [[ name: source ]],
                                    doGenerateSubmoduleConfigurations: false,
                                    extensions: [[$class: 'RelativeTargetDirectory', relativeTargetDir: 'WavesGUI']],
                                    submoduleCfg: [],
                                    userRemoteConfigs: [[url: repo_url]]
                                ])
                                sh """
                                cp -R ./WavesGUI/build-wallet/ ./WavesGUI/build-wallet-desktop/
                                cp -R ./WavesGUI/ ./WavesGUI_tmp/
                                cp -R ./WavesGUI_tmp/ ./WavesGUI/build-wallet/WavesGUI/
                                mv ./WavesGUI_tmp/ ./WavesGUI/build-wallet-desktop/WavesGUI/
                                """
                                container_info = "<p>Job name: ${env.JOB_NAME}</p>\n" +
                                "<p>Job build tag: ${env.BUILD_TAG}</p>\n" +
                                "<p>Git URL: ${scmVars.GIT_URL}</p>\n" +
                                "<p>Git branch: ${scmVars.GIT_BRANCH}</p>\n" +
                                "<p>Git commit: ${scmVars.GIT_COMMIT}</p>\n"
                            }
                            if (action.contains('Deploy')) {
                                checkout([
                                    $class: 'GitSCM',
                                    branches: [[name:'master']],
                                    doGenerateSubmoduleConfigurations: false,
                                    extensions: [[$class: 'RelativeTargetDirectory', relativeTargetDir: 'kubernetes']],
                                    submoduleCfg: [],
                                    userRemoteConfigs: [[credentialsId: Constants.KUBERNETES_REPO_CREDS, url: Constants.KUBERNETES_REPO]]
                                ])
                            }
                            sh 'mkdir out'
                        }

                    ['wallet', 'wallet-electron'].each{ serviceName ->
                        buildTasks["Building " + serviceName] = {
                            dir(Constants.DOCKERFILE_LOCATION_MAP[serviceName]) {
                                stage("Building " + serviceName) {
                                    if (action.contains('Build')) {
                                        try {
                                            def platform = (serviceName == 'wallet') ? 'web' : 'desktop'

                                            def waves_wallet_nginx_map = Constants.WAVES_WALLET_NGINX_MAP.clone()
                                            waves_wallet_nginx_map.waves_wallet_nginx_platform = "${platform}"
                                            String nginxConfFileContent = ut.replaceTemplateVars('./nginx/default_template.conf', waves_wallet_nginx_map)
                                            writeFile file: './nginx/default.conf', text: nginxConfFileContent

                                            def waves_wallet_dockerfile_map = Constants.WAVES_WALLET_DOCKERFILE_MAP.clone()
                                            waves_wallet_dockerfile_map.jenkins_platform = "${platform}"
                                            String dockerfileConfFileContent = ut.replaceTemplateVars('./Dockerfile_template', waves_wallet_dockerfile_map)
                                            writeFile file: './Dockerfile', text: dockerfileConfFileContent

                                            writeFile file: './nginx/htpasswd.users', text: Constants.WAVES_WALLET_NGINX_HTPASSWD_USERS

                                            container_info += "<p>Docker image: ${Constants.DOCKER_REGISTRY}/waves/${serviceName}:${source}.latest</p>\n<p>Web environemnt: \${WEB_ENVIRONMENT}</p>"
                                            writeFile file: './info.html', text: container_info

                                             sh """
                                                cp ./nginx/default.conf "${env.WORKSPACE}/out/default.conf-${serviceName}"
                                                cp ./Dockerfile "${env.WORKSPACE}/out/Dockerfile-${serviceName}"
                                                cp ./nginx/htpasswd.users "${env.WORKSPACE}/out/htpasswd.users-${serviceName}"
                                                cp ./info.html "${env.WORKSPACE}/out/info.html-${serviceName}"
                                                """

                                            ut.buildDockerImage('waves/' + serviceName, source, "--build-arg trading_view_token=${Constants.WAVES_WALLET_TRADING_VIEW_TOKEN} --build-arg platform=${platform}")
                                        }
                                        catch(err){
                                            currentBuild.result = Constants.PIPELINE_FAILURE
                                        }
                                        finally {
                                            ut.notifySlack("docker_builds",
                                                currentBuild.result,
                                                "Built image: ${Constants.DOCKER_REGISTRY}/waves/${serviceName}:${source}.latest")
                                        }
                                    }
                                    else{
                                        org.jenkinsci.plugins.pipeline.modeldefinition.Utils.markStageSkippedForConditional("Building " + serviceName)
                                    }
                                }
                            }
                        }
                    }
                    parallel buildTasks

                    ['wallet', 'wallet-electron'].each{ serviceName ->
                        deployTasks["Deploying " + serviceName] = {
                            stage("Deploying " + serviceName) {
                                if (action.contains('Deploy')) {
                                    if (serviceName == image) {
                                        try {
                                            def waves_wallet_deployment_map = [
                                                domain_name: destination.replaceAll("\\.","-"),
                                                network: network,
                                                tag: source,
                                                image: image,
                                                current_date: "'${ut.shWithOutput('date +%s')}'"
                                            ]
                                            if (action.contains('Build')) {
                                                waves_wallet_deployment_map.tag += '.latest'
                                            }
                                            String deploymentConfFileContent = ut.replaceTemplateVars('./kubernetes/waves-client-stage-waveswallet-io/deployment.yaml', waves_wallet_deployment_map)
                                            def deployment_config = "./out/${image}-deployment.yaml"
                                            writeFile file: "./out/${image}-deployment.yaml", text: deploymentConfFileContent

                                            withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', accessKeyVariable: 'AWS_ACCESS_KEY_ID', credentialsId: Constants.AWS_KUBERNETES_KEY, secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                                                sh """
                                                    docker run -i --rm \
                                                        -v "${env.WORKSPACE}/out":/root/app \
                                                        -e AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}" \
                                                        -e AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}" \
                                                        -e KUBE_CLUSTER_NAME="${Constants.AWS_KUBERNETES_KUBE_CLUSTER_NAME}" \
                                                        -e AWS_REGION="${Constants.AWS_KUBERNETES_AWS_REGION}" \
                                                        -e CONFIG_PATH="${image}-deployment.yaml" \
                                                        "${Constants.DOCKER_KUBERNETES_EXECUTOR_IMAGE}"
                                                    """
                                            }
                                        }
                                        catch(err){
                                                currentBuild.result = Constants.PIPELINE_FAILURE
                                        }
                                        finally {
                                            ut.notifySlack("waves-deploy-alerts",
                                                currentBuild.result,
                                                "Deployed image:\n${Constants.DOCKER_REGISTRY}/waves/${serviceName}:${source}.latest ${network} to ${destination}")
                                        }

                                    } else {
                                        org.jenkinsci.plugins.pipeline.modeldefinition.Utils.markStageSkippedForConditional("Deploying " + serviceName)
                                    }

                                }
                                else {
                                    org.jenkinsci.plugins.pipeline.modeldefinition.Utils.markStageSkippedForConditional("Deploying " + serviceName)
                                }
                            }
                        }
                    }
                    parallel deployTasks
                }
                catch (err) {
                    currentBuild.result = Constants.PIPELINE_FAILURE
                    println("ERROR caught")
                    println(err)
                    println(err.getMessage())
                    println(err.getStackTrace())
                    println(err.getCause())
                    println(err.getLocalizedMessage())
                    println(err.toString())
                 }
                finally{
                    sh "tar -czvf artifacts.tar.gz -C ./out ."
                    archiveArtifacts artifacts: 'artifacts.tar.gz'
                }
            }
        }
    }
}
